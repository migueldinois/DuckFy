import math
import json
import os
import uuid

from flask import Flask, render_template, request, redirect, session, flash, url_for
from decimal import Decimal, InvalidOperation
from database.conexao import Conexao
from model.categorias import Categoria
from model.usuarios import Usuario
from model.extrato import Extrato
from model.contas_bancarias import ContaBancaria
from model.reserva_emergencia import Reserva


app = Flask(__name__)
app.secret_key = "duckfy999"


def parse_valor_monetario(valor):
    texto = str(valor or "").strip().replace("R$", "").replace(" ", "")
    if "," in texto:
        texto = texto.replace(".", "").replace(",", ".")
    elif texto.count(".") > 1 or ("." in texto and len(texto.rsplit(".", 1)[1]) == 3):
        texto = texto.replace(".", "")
    return Decimal(texto)

@app.get("/")
@app.get("/login")
def index():

    if "usuario" in session:
        return redirect("/dashboard")
    
    
    return render_template("tela_login.html")


@app.route("/simulador", methods=["GET", "POST"])
def tela_simulador():
    aporte_inicial = 0.0
    aporte_mensal = 0.0
    anos = 5

    # Tenta capturar dados se for POST
    if request.method == "POST":
        try:
            anos = int(request.form.get("anos", 5))
            if anos <= 0:
                anos = 5
            aporte_inicial = float(request.form.get("aporte_inicial") or 0.0)
            aporte_mensal = float(request.form.get("aporte_mensal") or 0.0)
            anos = int(request.form.get("anos") or 5)
        except (ValueError, TypeError):
            pass

    taxa_anual = 10.0  # 10% a.a.
    taxa_mensal = (1 + (taxa_anual / 100)) ** (1 / 12) - 1
    meses = anos * 12

    labels = []
    investido_lista = []
    patrimonio_lista = []

    saldo_total = aporte_inicial
    for mes in range(1, meses + 1):
        saldo_total = (saldo_total + aporte_mensal) * (1 + taxa_mensal)
        investido_acumulado = aporte_inicial + (aporte_mensal * mes)

        labels.append(f"Mês {mes}")
        investido_lista.append(round(investido_acumulado, 2))
        patrimonio_lista.append(round(saldo_total, 2))

    total_investido = aporte_inicial + (aporte_mensal * meses)
    rendimentos = saldo_total - total_investido

    # Dicionário alinhado 100% com as variáveis do seu simulador.html
    resultado = {
        "total_investido": round(total_investido, 2),
        "rendimentos": round(rendimentos, 2),
        "taxa_anual_aplicada": taxa_anual,
        "grafico": {
            "labels": labels,
            "investido": investido_lista,
            "patrimonio": patrimonio_lista
        }
    }

    return render_template(
        "simulador.html",
        aporte_inicial=aporte_inicial,
        aporte_mensal=aporte_mensal,
        anos=anos,
        resultado=resultado
    )

def obter_estado_fogo(dias_ofensiva):
    dias = int(dias_ofensiva or 0)

    if dias <= 0:
        return {
            "estado": "apagado",
            "cor_principal": "#6C757D",
            "glow": "rgba(108, 117, 125, 0.15)",
            "tamanho_px": 100,
            "icone": "bi-fire",
            "titulo": "Começa a tua sequência hoje!",
            "mensagem": "Registre a tua atividade diária para acender a chama.",
        }

    if dias < 7:
        estado = "inicial"
        cor = "#B388FF"
        glow = "rgba(179, 136, 255, 0.2)"
        tamanho = 120
    elif dias < 30:
        estado = "media"
        cor = "#FF9800"
        glow = "rgba(255, 152, 0, 0.25)"
        tamanho = 140
    elif dias < 100:
        estado = "alta"
        cor = "#FFC107"
        glow = "rgba(255, 193, 7, 0.3)"
        tamanho = 160
    else:
        estado = "lendaria"
        cor = "#00E5FF"
        glow = "rgba(0, 229, 255, 0.3)"
        tamanho = 180

    unidade = "dia" if dias == 1 else "dias"
    return {
        "estado": estado,
        "cor_principal": cor,
        "glow": glow,
        "tamanho_px": tamanho,
        "icone": "bi-fire",
        "titulo": f"Sequência ativa há {dias} {unidade}!",
        "mensagem": "Continua a registar a tua atividade diária para manter a chama acesa.",
    }


@app.post("/login/usuario")
def logar():
    
    input_email = request.form.get("email")
    input_senha = request.form.get("senha")
    usuario_logado = Usuario.validar_usuario(input_email, input_senha)

    if usuario_logado:
        session["usuario"] = usuario_logado
        session["email"] = input_email
        session["id_usuario"] = Usuario.buscar_id_por_email(input_email)
        return redirect(url_for("dashboard"))
    else:
        flash("Usuario ou senha invalidos!", "error")
        return redirect('/login')
    
@app.route("/logout")
def logout():
    session.pop("usuario", None)
    flash("Você saiu da sua conta!", "success")
    return redirect("/login")

@app.get("/termos")
def termos():
    logado = "usuario" in session
    return render_template("termos.html", usuario_logado=logado)

@app.route('/privacidade')
def privacidade():
    logado = "usuario" in session
    return render_template("privacidade.html", usuario_logado=logado)

@app.route("/contas")
def contas():
    if "usuario" not in session or not session.get('id_usuario'):
        flash("Você precisa estar logado para acessar as contas!", "error")
        return redirect('/login')

    id_usuario = session['id_usuario']

    lista_contas = ContaBancaria.buscar_com_alocacao_reserva(id_usuario)
    total_contas = ContaBancaria.calcular_patrimonio_total(id_usuario)
    reserva = Reserva.obter_reserva(id_usuario)
    total_reservado = Decimal(str(reserva['valor_atual'] or 0)) if reserva else Decimal('0')
    patrimonio = Decimal(str(total_contas or 0))
    saldo_fora_reserva = patrimonio - total_reservado
    porcentagem_reservada = (
        (total_reservado / patrimonio) * 100
        if patrimonio > 0 else Decimal('0')
    )

    def formatar_moeda(valor):
        return f"{valor:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.')

    return render_template(
        'contas.html',
        contas_bancarias=lista_contas,
        patrimonio_total=formatar_moeda(patrimonio),
        reserva_total=formatar_moeda(total_reservado),
        saldo_fora_reserva=formatar_moeda(saldo_fora_reserva),
        porcentagem_reservada=porcentagem_reservada
    )


@app.route('/transferir_dinheiro', methods=['POST'])
def transferir_dinheiro():
    if "usuario" not in session or not session.get("id_usuario"):
        flash("Faça login novamente.", "error")
        return redirect(url_for('index'))

    id_usuario = session['id_usuario']

    try:
        id_conta_origem = int(request.form.get('id_conta_origem', ''))
        id_conta_destino = int(request.form.get('id_conta_destino', ''))
        valor_transferencia = parse_valor_monetario(request.form.get('valor', ''))

        if not valor_transferencia.is_finite() or valor_transferencia <= 0:
            raise ValueError

        if id_conta_origem == id_conta_destino:
            flash("Escolha duas contas diferentes.", "error")
            return redirect(url_for('contas'))

    except (ValueError, TypeError, InvalidOperation):
        flash("Informe duas contas válidas e um valor maior que zero.", "error")
        return redirect(url_for('contas'))

    sucesso = ContaBancaria.transferir_dinheiro(
        id_conta_origem,
        id_conta_destino,
        id_usuario, 
        valor_transferencia
    )

    if sucesso:
        flash(
            f"Transferência de R$ {valor_transferencia:.2f} realizada com sucesso!",
            "success"
        )
    else:
        flash(
            "Não foi possível transferir. Verifique as contas e o saldo disponível.",
            "error"
        )

    return redirect(url_for('contas'))

# Adicionar dinheiro a contas bancárias
@app.route('/contas/adicionar_dinheiro', methods=['POST'])
def adicionar_dinheiro():
    if "usuario" not in session or not session.get("id_usuario"):
        flash("Faça login novamente.", "error")
        return redirect(url_for('index'))

    id_usuario = session['id_usuario']

    try:
        id_conta = int(request.form.get('id_conta', ''))
        valor_adicionar = parse_valor_monetario(request.form.get('valor', ''))

        if not valor_adicionar.is_finite() or valor_adicionar <= 0:
            raise ValueError

    except (ValueError, TypeError, InvalidOperation):
        flash("Informe uma conta válida e um valor maior que zero.", "error")
        return redirect(url_for('contas'))

    sucesso = ContaBancaria.adicionar_dinheiro(
        id_conta,
        id_usuario,
        valor_adicionar
    )

    if sucesso:
        flash(
            f"R$ {valor_adicionar:.2f} adicionados à conta com sucesso!",
            "success"
        )
    else:
        flash(
            "Não foi possível adicionar dinheiro. Verifique a conta selecionada.",
            "error"
        )

    return redirect(url_for('contas'))

@app.post("/contas/<int:id_conta>/editar")
def editar_conta(id_conta):
    if "usuario" not in session or "id_usuario" not in session:
        flash("Você precisa estar logado para editar uma conta!", "error")
        return redirect('/login')

    id_usuario = session["id_usuario"]
    conta = ContaBancaria.buscar_por_id(id_conta, id_usuario)
    if not conta:
        flash("Conta bancária não encontrada.", "error")
        return redirect('/contas')

    nome_conta = request.form.get("nome_conta", "").strip()
    tipo_conta = request.form.get("tipo_conta", "").strip()
    saldo_texto = request.form.get("saldo_atual", "").strip()

    try:
        saldo_atual = parse_valor_monetario(saldo_texto)
    except (ValueError, TypeError, InvalidOperation):
        flash("Informe um saldo válido.", "error")
        return redirect('/contas')
    if not saldo_atual.is_finite() or saldo_atual < 0:
        flash("Informe um saldo válido.", "error")
        return redirect('/contas')

    if not nome_conta or len(nome_conta) > 50:
        flash("O nome da conta é obrigatório e deve ter até 50 caracteres.", "error")
        return redirect('/contas')
    if not tipo_conta or len(tipo_conta) > 40:
        flash("O tipo da conta é obrigatório e deve ter até 40 caracteres.", "error")
        return redirect('/contas')

    if ContaBancaria.atualizar_conta(id_conta, id_usuario, nome_conta, tipo_conta, saldo_atual):
        flash("Conta atualizada com sucesso!", "success")
    else:
        flash("O saldo não pode ser menor que o valor já reservado.", "error")

    return redirect('/contas')

@app.route('/contas/<int:id_conta>/excluir', methods=['POST'])
def excluir_conta(id_conta):
    if "usuario" not in session or not session.get("id_usuario"):
        flash("Faça login novamente.", "error")
        return redirect(url_for('login'))

    sucesso = ContaBancaria.deletar_conta(
        id_conta,
        session['id_usuario']
    )

    if sucesso:
        flash("Conta bancária excluída com sucesso!", "success")
    else:
        flash("Não foi possível excluir a conta bancária.", "error")

    return redirect(url_for('contas'))
@app.route('/contas/criar', methods=['POST'])
def criar_conta():
    if "usuario" not in session or "id_usuario" not in session:
        flash("Faça login novamente para cadastrar uma conta.", "error")
        return redirect(url_for('login'))

    id_usuario = session.get('id_usuario')
    nome_conta = request.form.get('nome_conta', '').strip()
    tipo_conta = request.form.get('tipo_conta', '').strip()
    saldo_atual = request.form.get('saldo_atual', '0').strip()

    if not nome_conta or not tipo_conta:
        flash("Preencha todos os campos.", "error")
        return redirect(url_for('contas'))

    try:
        saldo_atual = parse_valor_monetario(saldo_atual)

        if not saldo_atual.is_finite() or saldo_atual < 0:
            raise ValueError

        sucesso = ContaBancaria.criar_conta(
            id_usuario,
            nome_conta,
            tipo_conta,
            saldo_atual
        )

        if sucesso:
            flash("Conta bancária criada com sucesso!", "success")
        else:
            flash("Não foi possível criar a conta bancária.", "error")

    except (ValueError, TypeError, InvalidOperation):
        flash("Informe um saldo válido.", "error")

    return redirect(url_for('contas'))
@app.route('/reserva_emergencia')
def reserva_emergencia():
    if "usuario" not in session:
        flash("Você precisa estar logado para acessar a reserva!", "error")
        return redirect('/login')

    # Busca o ID do usuário através do email da sessão
    email_usuario = session.get("email")
    id_usuario = Reserva.obter_id_por_email(email_usuario)

    # Busca os dados no banco
    reserva = Reserva.obter_reserva(id_usuario)
    historico_movimentacoes = Reserva.obter_historico(id_usuario)
    contas_usuario = Reserva.obter_contas_usuario(id_usuario)

    if reserva:
        total_guardado = float(reserva['valor_atual'])
        meta_total = float(reserva['meta_valor'])
    else:
        total_guardado = 0.00
        meta_total = 3000.00

    faltam_para_meta = max(0.0, meta_total - total_guardado)
    progresso_porcentagem = round((total_guardado / meta_total) * 100) if meta_total > 0 else 0
    progresso_barra = min(100, progresso_porcentagem)

    return render_template(
        'reserva_emergencia.html',
        meta_total=meta_total,
        total_guardado=total_guardado,
        faltam_para_meta=faltam_para_meta,
        progresso_porcentagem=progresso_porcentagem,
        progresso_barra=progresso_barra,
        historico_movimentacoes=historico_movimentacoes,
        contas_usuario=contas_usuario
    )


@app.route('/guardar_reserva', methods=['POST'])
def guardar_reserva():
    if "usuario" not in session:
        flash("Sessão expirada. Faça login novamente.", "error")
        return redirect('/login')

    email_usuario = session.get("email")
    id_usuario = Reserva.obter_id_por_email(email_usuario)

    try:
        valor_guardar = parse_valor_monetario(request.form.get('valor', ''))
        id_conta = int(request.form.get('id_conta', ''))
    except (InvalidOperation, ValueError, AttributeError):
        valor_guardar = Decimal('0')
        id_conta = None

    descricao = request.form.get('descricao', 'Depósito na Reserva')

    if not valor_guardar.is_finite() or valor_guardar <= 0 or id_conta is None:
        flash("Informe uma conta e um valor válido maior que zero!", "error")
        return redirect(url_for('reserva_emergencia'))

    if not Reserva.guardar_dinheiro(id_usuario, id_conta, valor_guardar, descricao):
        flash("A conta selecionada não existe ou não tem saldo suficiente.", "error")
        return redirect(url_for('reserva_emergencia'))

    flash(f'R$ {valor_guardar:.2f} guardados na reserva com sucesso!', 'success')
    return redirect(url_for('reserva_emergencia'))


@app.route('/retirar_reserva', methods=['POST'])
def retirar_reserva():
    if "usuario" not in session or not session.get("id_usuario"):
        flash("Sessão expirada. Faça login novamente.", "error")
        return redirect('/login')

    try:
        valor_retirar = parse_valor_monetario(request.form.get('valor', ''))
        id_conta = int(request.form.get('id_conta', ''))
    except (InvalidOperation, ValueError, AttributeError):
        valor_retirar = Decimal('0')
        id_conta = None

    if not valor_retirar.is_finite() or valor_retirar <= 0 or id_conta is None:
        flash("Informe uma conta e um valor válido maior que zero.", "error")
        return redirect(url_for('reserva_emergencia'))

    descricao = request.form.get('descricao', '').strip() or 'Retirada da reserva'
    if not Reserva.retirar_dinheiro(session['id_usuario'], id_conta, valor_retirar, descricao):
        flash("Não foi possível retirar: confira o saldo da reserva e a conta selecionada.", "error")
        return redirect(url_for('reserva_emergencia'))

    flash(f'R$ {valor_retirar:.2f} retirados da reserva com sucesso!', 'withdrawal')
    return redirect(url_for('reserva_emergencia'))


@app.route('/alterar_meta_reserva', methods=['POST'])
def alterar_meta_reserva():
    if "usuario" not in session or not session.get("id_usuario"):
        flash("Sessão expirada. Faça login novamente.", "error")
        return redirect('/login')

    try:
        nova_meta = parse_valor_monetario(request.form.get('meta_valor', ''))
    except (InvalidOperation, AttributeError):
        nova_meta = Decimal('0')

    if not nova_meta.is_finite() or nova_meta <= 0 or nova_meta > Decimal('99999999.99'):
        flash("Informe uma meta válida maior que zero.", "error")
        return redirect(url_for('reserva_emergencia'))

    Reserva.atualizar_meta(session['id_usuario'], nova_meta)
    flash("Meta da reserva atualizada com sucesso!", "success")
    return redirect(url_for('reserva_emergencia'))
    

@app.get('/dashboard')
def dashboard():
    if "usuario" in session:
        return render_template("dashboard.html")
    else:
        flash("Você precisa estar logado para acessar o dashboard!", "error")
        return redirect('/login')

@app.get("/sequencia")
def sequencia():
    if "usuario" in session:
        usuario = Usuario.recuperar_dados_usuario(session["email"])
        info_fogo = obter_estado_fogo(usuario["dias_ofensiva"])
        return render_template("sequencia.html", usuario=usuario, info_fogo=info_fogo)
    else:
        flash("Você precisa estar logado para acessar a sequência!", "error")
        return redirect('/login')

# Rota para exibir o perfil do usuário
@app.route("/perfil", methods=["GET", "POST"])
def perfil():


    dados_usuario = Usuario.recuperar_dados_usuario(session["email"])

    usuario = {
        "nome": dados_usuario["nome"],
        "email": dados_usuario["email"],
        "dias_ofensiva": dados_usuario["dias_ofensiva"],
        "pontos_xp": dados_usuario["pontos_xp"],
        "foto_perfil": dados_usuario["foto_perfil"],
    }


    if request.method == "POST":
        usuario["nome"] = request.form.get("nome", "").strip() or "Usuário"
        
    return render_template("perfil.html", usuario=usuario)


@app.route("/editar-perfil", methods=["GET", "POST"])
def editar_perfil():
    if "usuario" not in session:
        flash("Você precisa estar logado para editar o seu perfil!", "error")
        return redirect('/login')

    email_atual = session["email"]

    if request.method == "POST":
        nome = request.form.get("nome", "").strip()
        email = request.form.get("email", "").strip()
        usuario = Usuario.recuperar_dados_usuario(email_atual)

        if not nome or not email or "@" not in email:
            flash("Informe um nome e um e-mail válido.", "error")
            return render_template("editar_perfil.html", usuario=usuario), 400

        foto_perfil = usuario["foto_perfil"]
        arquivo_foto = request.files.get("foto_perfil")
        if arquivo_foto and arquivo_foto.filename:
            extensao = os.path.splitext(secure_filename(arquivo_foto.filename))[1].lower()
            if extensao not in {".jpg", ".jpeg", ".png", ".webp", ".gif"}:
                flash("Escolha uma imagem JPG, PNG, WEBP ou GIF.", "error")
                return render_template("editar_perfil.html", usuario=usuario), 400

            nome_arquivo = f"{uuid.uuid4().hex}{extensao}"
            pasta_uploads = os.path.join(app.static_folder, "uploads", "perfis")
            os.makedirs(pasta_uploads, exist_ok=True)
            arquivo_foto.save(os.path.join(pasta_uploads, nome_arquivo))
            foto_perfil = url_for("static", filename=f"uploads/perfis/{nome_arquivo}")

        if Usuario.atualizar_dados(email_atual, nome, email, foto_perfil):
            session["email"] = email
            flash("Perfil atualizado com sucesso!", "success")
            return redirect(url_for("perfil"))

        usuario = Usuario.recuperar_dados_usuario(email_atual)
        flash("Não foi possível atualizar. Verifique se o e-mail já está em uso.", "error")
        return render_template("editar_perfil.html", usuario=usuario), 400

    usuario = Usuario.recuperar_dados_usuario(email_atual)
    return render_template("editar_perfil.html", usuario=usuario)

@app.get("/extrato")
def tela_extrato():
    try:
        # Pega o ID da sessão do usuário logado (ou usa 1 como fallback)
        id_usuario = session.get('id_usuario', 1)

        tipo_ativo = request.args.get('tipo', 'tudo')
        id_conta = request.args.get('id_conta', type=int)
        data_inicio = request.args.get('data_inicio')
        data_fim = request.args.get('data_fim')

        lista_transacoes = Extrato.obter_extrato(
            id_usuario=id_usuario,
            tipo=tipo_ativo,
            id_conta=id_conta,
            data_inicio=data_inicio,
            data_fim=data_fim
        )

        return render_template('extrato.html', transacoes=lista_transacoes, tipo_ativo=tipo_ativo)

    except Exception as e:
        print(f"Erro na rota /extrato: {e}")
        # Retorno de segurança em caso de exceção para não quebrar o Flask
        return render_template('extrato.html', transacoes=[], tipo_ativo='tudo')

    
    


@app.get("/lancamento")
def lancamento():
    if "usuario" in session:
                return render_template("lancamentos.html")
    else:
        flash("Você precisa estar logado para editar o seu perfil!", "error")
        return redirect('/login')

@app.get("/categorias")
def categorias():
    if "usuario" in session:
        categorias_despesa = Categoria.recuperar_categorias_por_tipo(session["id_usuario"], "Despesa")
        categorias_receita = Categoria.recuperar_categorias_por_tipo(session["id_usuario"], "Receita")

        return render_template("categorias.html", categorias_despesa=categorias_despesa, categorias_receita=categorias_receita)
    else:
        flash("Você precisa estar logado para acessar as categorias!", "error")
        return redirect('/login')

@app.route("/categorias/criar", methods=["POST"])
def adicionar_categoria():
    if "usuario" in session:
        nome = request.form.get("nome")
        tipo = request.form.get("tipo")

        if tipo == "SAIDA":
            tipo = "Despesa"
        elif tipo == "ENTRADA":
            tipo = "Receita"
        emoji = request.form.get("emoji")
        cor = request.form.get("cor")

        if not nome or not tipo or not emoji or not cor:
            flash("Todos os campos são obrigatórios!", "error")
            return redirect('/categorias')

        categoria_criada = Categoria.criar_categoria(session["id_usuario"], nome, tipo, emoji, cor)

        if categoria_criada:
            flash("Categoria criada com sucesso!", "success")
        else:
            flash("Erro ao criar categoria. Tente novamente.", "error")

        return redirect('/categorias')
    else:
        flash("Você precisa estar logado para adicionar categorias!", "error")
        return redirect('/login')
@app.route("/categorias/deletar/<int:id_categoria>", methods=["POST"])
def deletar_categoria(id_categoria):
    if "usuario" in session:
        categoria_deletada = Categoria.deletar_categoria(id_categoria)

        if categoria_deletada:
            flash("Categoria deletada com sucesso!", "success")
        else:
            flash("Erro ao deletar categoria. Tente novamente.", "error")

        return redirect('/categorias')
    else:
        flash("Você precisa estar logado para deletar categorias!", "error")
        return redirect('/login')

@app.route("/categorias/atualizar/", methods=["POST"])
def atualizar_categoria():
    if "usuario" in session:
        id_categoria = request.form.get("id_categoria")
        nome = request.form.get("nome")
        tipo = request.form.get("tipo")
        emoji = request.form.get("emoji")
        cor = request.form.get("cor")

        if tipo == "SAIDA":
            tipo = "Despesa"
        elif tipo == "ENTRADA":
            tipo = "Receita"

        if not id_categoria or not nome or not tipo or not emoji or not cor:
            flash("Todos os campos são obrigatórios!", "error")
            return redirect('/categorias')

        categoria_atualizada = Categoria.atualizar_categoria(id_categoria, nome, tipo, emoji, cor)

        if categoria_atualizada:
            flash("Categoria atualizada com sucesso!", "success")
        else:
            flash("Erro ao atualizar categoria. Tente novamente.", "error")

        return redirect('/categorias')
    else:
        flash("Você precisa estar logado para atualizar categorias!", "error")
        return redirect('/login')

@app.get("/cadastro")
def cadastro():
    if "usuario" in session:
        return redirect('/dashboard')
    else:
        return render_template("cadastro.html")

@app.route("/cadastro/usuario", methods=["POST"])
def cadastrar():
    nome = request.form.get("nome")
    email = request.form.get("email")
    senha = request.form.get("senha")
    confirmar_senha = request.form.get("confirma_senha")
    foto_perfil = request.form.get("foto_perfil") or "https://placehold.co/400x400"

    if not nome or not email or not senha:
        flash("Todos os campos são obrigatórios!", "error")
        return redirect('/cadastro')

    usuario_criado = Usuario.criar_usuario(nome, email, senha, foto_perfil)

    if usuario_criado:
        return redirect('/login')
    else:
        flash("Erro ao cadastrar usuário. Tente novamente.", "error")
        return redirect('/cadastro')
    
@app.get("/redefinir")
def redefinir():
    if "usuario" in session:
        return redirect('/dashboard')
    else:
        return render_template("redefinir_senha.html")



if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=8080)
