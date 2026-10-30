import math

import random
import os
import secrets
from dotenv import load_dotenv
from datetime import datetime, timedelta
from flask_mail import Mail, Message
import requests
from flask import Flask, render_template, request, redirect, session, flash, url_for
from decimal import Decimal, InvalidOperation

# importa a função para proteger nomes de arquivos enviados
from werkzeug.utils import secure_filename

# importa as classes do projeto
from database.conexao import Conexao
from model.categorias import Categoria
from model.usuarios import Usuario
from model.extrato import Extrato
from model.contas_bancarias import ContaBancaria
from model.reserva_emergencia import Reserva
from model.simulador import SimuladorPatrimonio

load_dotenv()


# inicia a aplicação flask
app = Flask(__name__)
app.secret_key = "duckfy999"

app.config["MAIL_SERVER"] = "smtp.gmail.com"
app.config["MAIL_PORT"] = 587
app.config["MAIL_USE_TLS"] = True
app.config["MAIL_USERNAME"] = "duckfy67@gmail.com"
app.config["MAIL_PASSWORD"] = os.getenv("SMTP_KEY")
app.config["MAIL_DEFAULT_SENDER"] = os.getenv("EMAIL_REMETENTE")
app.config["MAIL_TIMEOUT"] = 10

mail = Mail(app)

codigos_recuperacao = {}




# converte valores monetários para decimal
def parse_valor_monetario(valor):
    texto = str(valor or "").strip().replace("R$", "").replace(" ", "")
    if "," in texto:
        texto = texto.replace(".", "").replace(",", ".")
    elif texto.count(".") > 1 or ("." in texto and len(texto.rsplit(".", 1)[1]) == 3):
        texto = texto.replace(".", "")
    return Decimal(texto)


# busca a taxa selic na api do banco central
def obter_taxa_selic_bcb():
    """Busca a taxa Selic/CDI na API do Banco Central (SGS 1178)"""
    url = "https://api.bcb.gov.br/dados/serie/bcdata.sgs.1178/dados/ultimos/1?formato=json"
    try:
        response = requests.get(url, timeout=3)
        if response.status_code == 200:
            dados = response.json()
            if dados and len(dados) > 0:
                return float(dados[0]["valor"])
    except Exception as e:
        print(f"Erro ao buscar taxa do BCB: {e}")

    return 10.0


# verifica se o usuário já está logado
@app.get("/")
@app.get("/login")
def index():

    if "usuario" in session:
        return redirect("/dashboard")

    return render_template("tela_login.html")


# formata valores para o padrão brasileiro


def parse_valor_monetario(valor):
    texto = str(valor or "").strip().replace("R$", "").replace(" ", "")
    if "," in texto:
        texto = texto.replace(".", "").replace(",", ".")
    elif texto.count(".") > 1 or ("." in texto and len(texto.rsplit(".", 1)[1]) == 3):
        texto = texto.replace(".", "")
    return Decimal(texto)


def formatar_moeda_brl(valor):
    """Converte valores numéricos para a pontuação brasileira R$ X.XXX,XX"""
    return f"{valor:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")



def parse_valor_monetario(valor):
    texto = str(valor or "").strip().replace("R$", "").replace(" ", "")
    if "," in texto:
        texto = texto.replace(".", "").replace(",", ".")
    elif texto.count(".") > 1 or ("." in texto and len(texto.rsplit(".", 1)[1]) == 3):
        texto = texto.replace(".", "")
    return Decimal(texto)

@app.get("/login")
def login():

    if "usuario" in session:
        return redirect("/dashboard")
    
    
    return render_template("tela_login.html")

def formatar_moeda_brl(valor):
    """Converte valores numéricos para a pontuação brasileira R$ X.XXX,XX"""
    return f"{valor:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


# exibe e calcula a simulação de patrimônio
@app.route("/simulador", methods=["GET", "POST"])
def tela_simulador():
    aporte_inicial = 0.0
    aporte_mensal = 0.0
    anos = 5

    # recebe os dados enviados pelo formulário
    if request.method == "POST":
        try:
            anos = int(request.form.get("anos", 5))
            if anos <= 0:
                anos = 5
            anos = int(request.form.get("anos") or 5)
            aporte_inicial = float(parse_valor_monetario(request.form.get("aporte_inicial")))
            aporte_mensal = float(parse_valor_monetario(request.form.get("aporte_mensal")))
        except (ValueError, TypeError, InvalidOperation):
            anos, aporte_inicial, aporte_mensal = 5, 0.0, 0.0

    # verifica se a simulação foi realizada
    simulado = request.method == "POST" and (aporte_inicial > 0 or aporte_mensal > 0)

    if anos <= 0:
        anos = 5

    # calcula as taxas e o período da simulação
    taxa_anual_pct = obter_taxa_selic_bcb()
    taxa_anual = taxa_anual_pct / 100
    taxa_mensal = ((1 + taxa_anual) ** (1 / 12)) - 1
    meses = anos * 12

    # prepara os dados do gráfico e da tabela
    labels = []
    investido_lista = []
    patrimonio_lista = []
    tabela_anual = []
    saldo_atual = aporte_inicial
    capital_inicial_ano = saldo_atual

    # calcula a evolução do patrimônio mês a mês
    for mes in range(1, meses + 1):
        saldo_atual = saldo_atual * (1 + taxa_mensal) + aporte_mensal
        total_investido = aporte_inicial + aporte_mensal * mes

        labels.append(f"Mês {mes}")
        investido_lista.append(round(total_investido, 2))
        patrimonio_lista.append(round(saldo_atual, 2))

        # registra os resultados ao final de cada ano
        if mes % 12 == 0:
            ano = mes // 12
            juros_ganhos_ano = saldo_atual - capital_inicial_ano - aporte_mensal * 12
            tabela_anual.append({
                "ano": ano,
                "capital_inicial": round(capital_inicial_ano, 2),
                "juros_ano": round(juros_ganhos_ano, 2),
                "montante_final": round(saldo_atual, 2)
            })
            capital_inicial_ano = saldo_atual

    # organiza os resultados da simulação
    rendimentos_totais = saldo_atual - total_investido
    resultado = {
        "valor_total_final": round(saldo_atual, 2),
        "total_investido": round(total_investido, 2),
        "rendimentos": round(rendimentos_totais, 2),
        "taxa_anual_aplicada": taxa_anual_pct,
        "tabela_anual": tabela_anual,
        "grafico": {
            "labels": labels,
            "investido": investido_lista,
            "patrimonio": patrimonio_lista
        }
    }

    # envia os resultados para a página
    return render_template(
        "simulador.html",
        aporte_inicial=aporte_inicial,
        aporte_mensal=aporte_mensal,
        anos=anos,
        resultado=resultado,
        simulado=simulado
    )


# define a aparência da sequência de dias
def obter_estado_fogo(dias_ofensiva):
    dias = int(dias_ofensiva or 0)

    # retorna o estado inicial da chama
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

    # define a aparência conforme os dias acumulados
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


# realiza o login do usuário
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


# encerra a sessão do usuário
@app.route("/logout")
def logout():
    session.pop("usuario", None)
    flash("Você saiu da sua conta!", "success")
    return redirect("/login")


# exibe os termos conforme o tipo de acesso
@app.get("/termos")
def termos():
    logado = "usuario" in session
    layout_base = "layout.html" if logado else "layout_publico.html"
    return render_template("termos.html", usuario_logado=logado, layout_base=layout_base)


# exibe a política de privacidade
@app.route('/privacidade')
def privacidade():
    logado = "usuario" in session
    layout_base = "layout.html" if logado else "layout_publico.html"
    return render_template("privacidade.html", usuario_logado=logado, layout_base=layout_base)


# exibe as contas bancárias do usuário
@app.route("/contas")
def contas():
    if "usuario" not in session or not session.get('id_usuario'):
        flash("Você precisa estar logado para acessar as contas!", "error")
        return redirect('/login')

    id_usuario = session['id_usuario']

    # busca as contas e os valores da reserva
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

    # formata os valores exibidos na página
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


# transfere dinheiro entre contas
@app.route('/transferir_dinheiro', methods=['POST'])
def transferir_dinheiro():
    if "usuario" not in session or not session.get("id_usuario"):
        flash("Faça login novamente.", "error")
        return redirect(url_for('index'))

    id_usuario = session['id_usuario']

    # valida as contas e o valor informado
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

    # executa a transferência
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


# adiciona dinheiro a uma conta bancária
@app.route('/contas/adicionar_dinheiro', methods=['POST'])
def adicionar_dinheiro():
    if "usuario" not in session or not session.get("id_usuario"):
        flash("Faça login novamente.", "error")
        return redirect(url_for('index'))

    id_usuario = session['id_usuario']

    # valida a conta e o valor informado
    try:
        id_conta = int(request.form.get('id_conta', ''))
        valor_adicionar = parse_valor_monetario(request.form.get('valor', ''))

        if not valor_adicionar.is_finite() or valor_adicionar <= 0:
            raise ValueError

    except (ValueError, TypeError, InvalidOperation):
        flash("Informe uma conta válida e um valor maior que zero.", "error")
        return redirect(url_for('contas'))

    # realiza a adição do dinheiro
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


# atualiza os dados de uma conta bancária
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

    # recebe os novos dados da conta
    nome_conta = request.form.get("nome_conta", "").strip()
    tipo_conta = request.form.get("tipo_conta", "").strip()
    saldo_texto = request.form.get("saldo_atual", "").strip()

    # valida o saldo informado
    try:
        saldo_atual = parse_valor_monetario(saldo_texto)
    except (ValueError, TypeError, InvalidOperation):
        flash("Informe um saldo válido.", "error")
        return redirect('/contas')
    if not saldo_atual.is_finite() or saldo_atual < 0:
        flash("Informe um saldo válido.", "error")
        return redirect('/contas')
    if saldo_atual > ContaBancaria.SALDO_MAXIMO:
        flash("O saldo máximo por conta é R$ 99.999.999,99.", "error")
        return redirect('/contas')

    # valida os dados de identificação da conta
    if not nome_conta or len(nome_conta) > 50:
        flash("O nome da conta é obrigatório e deve ter até 50 caracteres.", "error")
        return redirect('/contas')
    if not tipo_conta or len(tipo_conta) > 40:
        flash("O tipo da conta é obrigatório e deve ter até 40 caracteres.", "error")
        return redirect('/contas')

    # salva as alterações da conta
    if ContaBancaria.atualizar_conta(id_conta, id_usuario, nome_conta, tipo_conta, saldo_atual):
        flash("Conta atualizada com sucesso!", "success")
    else:
        flash("O saldo não pode ser menor que o valor já reservado.", "error")

    return redirect('/contas')


# exclui uma conta bancária
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


# cadastra uma nova conta bancária
@app.route('/contas/criar', methods=['POST'])
def criar_conta():
    if "usuario" not in session or "id_usuario" not in session:
        flash("Faça login novamente para cadastrar uma conta.", "error")
        return redirect(url_for('login'))

    id_usuario = session.get('id_usuario')
    nome_conta = request.form.get('nome_conta', '').strip()
    tipo_conta = request.form.get('tipo_conta', '').strip()
    saldo_atual = request.form.get('saldo_atual', '0').strip()

    # verifica se os campos obrigatórios foram preenchidos
    if not nome_conta or not tipo_conta:
        flash("Preencha todos os campos.", "error")
        return redirect(url_for('contas'))

    # valida o saldo e cria a conta
    try:
        saldo_atual = parse_valor_monetario(saldo_atual)

        if not saldo_atual.is_finite() or saldo_atual < 0:
            raise ValueError
        if saldo_atual > ContaBancaria.SALDO_MAXIMO:
            flash("O saldo máximo por conta é R$ 99.999.999,99.", "error")
            return redirect(url_for('contas'))

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


# exibe os dados da reserva de emergência
@app.route('/reserva_emergencia')
def reserva_emergencia():
    if "usuario" not in session:
        flash("Você precisa estar logado para acessar a reserva!", "error")
        return redirect('/login')

    # busca o usuário e os dados da reserva
    email_usuario = session.get("email")
    id_usuario = Reserva.obter_id_por_email(email_usuario)

    # busca o histórico e as contas disponíveis
    reserva = Reserva.obter_reserva(id_usuario)
    historico_movimentacoes = Reserva.obter_historico(id_usuario)
    contas_usuario = Reserva.obter_contas_usuario(id_usuario)

    # define os valores iniciais da reserva
    if reserva:
        total_guardado = float(reserva['valor_atual'])
        meta_total = float(reserva['meta_valor'])
    else:
        total_guardado = 0.00
        meta_total = 3000.00

    # calcula o progresso da meta
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


# adiciona dinheiro à reserva de emergência
@app.route('/guardar_reserva', methods=['POST'])
def guardar_reserva():
    if "usuario" not in session:
        flash("Sessão expirada. Faça login novamente.", "error")
        return redirect('/login')

    email_usuario = session.get("email")
    id_usuario = Reserva.obter_id_por_email(email_usuario)

    # recebe e valida o valor e a conta
    try:
        valor_guardar = parse_valor_monetario(request.form.get('valor', ''))
        id_conta = int(request.form.get('id_conta', ''))
    except (InvalidOperation, ValueError, AttributeError):
        valor_guardar = Decimal('0')
        id_conta = None

    descricao = request.form.get('descricao', 'Depósito na Reserva')

    # verifica os dados antes de guardar
    if not valor_guardar.is_finite() or valor_guardar <= 0 or id_conta is None:
        flash("Informe uma conta e um valor válido maior que zero!", "error")
        return redirect(url_for('reserva_emergencia'))

    if not Reserva.guardar_dinheiro(id_usuario, id_conta, valor_guardar, descricao):
        flash("A conta selecionada não existe ou não tem saldo suficiente.", "error")
        return redirect(url_for('reserva_emergencia'))

    flash(f'R$ {valor_guardar:.2f} guardados na reserva com sucesso!', 'success')
    return redirect(url_for('reserva_emergencia'))


# retira dinheiro da reserva de emergência
@app.route('/retirar_reserva', methods=['POST'])
def retirar_reserva():
    if "usuario" not in session or not session.get("id_usuario"):
        flash("Sessão expirada. Faça login novamente.", "error")
        return redirect('/login')

    # recebe e valida os dados da retirada
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


# atualiza a meta da reserva de emergência
@app.route('/alterar_meta_reserva', methods=['POST'])
def alterar_meta_reserva():
    if "usuario" not in session or not session.get("id_usuario"):
        flash("Sessão expirada. Faça login novamente.", "error")
        return redirect('/login')

    # valida o novo valor da meta
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


# exibe o painel principal
@app.get('/dashboard')
def dashboard():
    if "usuario" in session:
        return render_template("dashboard.html")
    else:
        flash("Você precisa estar logado para acessar o dashboard!", "error")
        return redirect('/login')


# exibe a sequência de atividades do usuário
@app.get("/sequencia")
def sequencia():
    if "usuario" in session:
        usuario = Usuario.recuperar_dados_usuario(session["email"])
        info_fogo = obter_estado_fogo(usuario["dias_ofensiva"])
        return render_template("sequencia.html", usuario=usuario, info_fogo=info_fogo)
    else:
        flash("Você precisa estar logado para acessar a sequência!", "error")
        return redirect('/login')


# exibe o perfil do usuário
@app.route("/perfil", methods=["GET", "POST"])
def perfil():
    email = session.get("email")
    if not email:
        flash("Sua sessão expirou. Entre novamente para acessar seu perfil.", "error")
        return redirect('/login')

    dados_usuario = Usuario.recuperar_dados_usuario(email)
    if not dados_usuario:
        flash("Não foi possível localizar os dados do seu perfil.", "error")
        return redirect('/login')

    # organiza as informações do perfil
    usuario = {
        "nome": dados_usuario["nome"],
        "email": dados_usuario["email"],
        "dias_ofensiva": dados_usuario["dias_ofensiva"],
        "pontos_xp": dados_usuario["pontos_xp"],
        "foto_perfil": dados_usuario["foto_perfil"],
    }

    # recebe a alteração do nome
    if request.method == "POST":
        usuario["nome"] = request.form.get("nome", "").strip() or "Usuário"

    return render_template("perfil.html", usuario=usuario)


# atualiza as informações do perfil
@app.route("/editar-perfil", methods=["GET", "POST"])
def editar_perfil():
    if "usuario" not in session:
        flash("Você precisa estar logado para editar o seu perfil!", "error")
        return redirect('/login')

    email_atual = session["email"]

    if request.method == "POST":
        # recebe os novos dados do formulário
        nome = request.form.get("nome", "").strip()
        email = request.form.get("email", "").strip()
        usuario = Usuario.recuperar_dados_usuario(email_atual)

        # verifica os campos obrigatórios
        if not nome or not email or "@" not in email:
            flash("Informe um nome e um e-mail válido.", "error")
            return render_template("editar_perfil.html", usuario=usuario), 400

        # processa a foto de perfil enviada
        foto_perfil = usuario["foto_perfil"]
        arquivo_foto = request.files.get("foto_perfil")
        if arquivo_foto and arquivo_foto.filename:
            extensao = os.path.splitext(secure_filename(arquivo_foto.filename))[1].lower()
            if extensao not in {".jpg", ".jpeg", ".png", ".webp", ".gif"}:
                flash("Escolha uma imagem JPG, PNG, WEBP ou GIF.", "error")
                return render_template("editar_perfil.html", usuario=usuario), 400

            # salva a imagem na pasta de uploads
            nome_arquivo = f"{uuid.uuid4().hex}{extensao}"
            pasta_uploads = os.path.join(app.static_folder, "uploads", "perfis")
            os.makedirs(pasta_uploads, exist_ok=True)
            arquivo_foto.save(os.path.join(pasta_uploads, nome_arquivo))
            foto_perfil = url_for("static", filename=f"uploads/perfis/{nome_arquivo}")

        # salva as alterações no banco de dados
        if Usuario.atualizar_dados(email_atual, nome, email, foto_perfil):
            session["email"] = email
            flash("Perfil atualizado com sucesso!", "success")
            return redirect(url_for("perfil"))

        usuario = Usuario.recuperar_dados_usuario(email_atual)
        flash("Não foi possível atualizar. Verifique se o e-mail já está em uso.", "error")
        return render_template("editar_perfil.html", usuario=usuario), 400

    usuario = Usuario.recuperar_dados_usuario(email_atual)
    return render_template("editar_perfil.html", usuario=usuario)


# exclui a conta e os arquivos do usuário
@app.post("/excluir-conta")
def excluir_conta_usuario():
    id_usuario = session.get("id_usuario")
    if "usuario" not in session or not id_usuario:
        flash("Faça login novamente para excluir sua conta.", "error")
        return redirect(url_for("index"))

    dados_usuario = Usuario.recuperar_dados_usuario(session["email"])
    if not Usuario.excluir_usuario(id_usuario):
        flash("Não foi possível excluir sua conta. Tente novamente.", "error")
        return redirect(url_for("editar_perfil"))

    # remove a foto de perfil salva no servidor
    foto_perfil = (dados_usuario or {}).get("foto_perfil", "")
    prefixo_upload = "/static/uploads/perfis/"
    if foto_perfil.startswith(prefixo_upload):
        caminho_foto = os.path.join(
            app.static_folder,
            "uploads",
            "perfis",
            os.path.basename(foto_perfil)
        )
        if os.path.isfile(caminho_foto):
            os.remove(caminho_foto)

    # encerra a sessão após a exclusão
    session.clear()
    flash("Sua conta e seus dados foram excluídos.", "success")
    return redirect(url_for("index"))


# exibe o extrato financeiro
@app.get("/extrato")
def tela_extrato():
    try:
        # busca o id do usuário e os filtros selecionados
        id_usuario = session.get('id_usuario', 1)

        tipo_ativo = request.args.get('tipo', 'tudo')
        id_conta = request.args.get('id_conta', type=int)
        data_inicio = request.args.get('data_inicio')
        data_fim = request.args.get('data_fim')

        # consulta as movimentações financeiras
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
        # exibe a página sem transações em caso de erro
        return render_template('extrato.html', transacoes=[], tipo_ativo='tudo')


# exibe a página de lançamentos
@app.get("/lancamento")
def lancamento():
    if "usuario" in session:
        return render_template("lancamentos.html")
    else:
        flash("Você precisa estar logado para editar o seu perfil!", "error")
        return redirect('/login')


# exibe as categorias de despesas e receitas
@app.get("/categorias")
def categorias():
    if "usuario" in session:
        # busca as categorias de cada tipo
        categorias_despesa = Categoria.recuperar_categorias_por_tipo(session["id_usuario"], "Despesa")
        categorias_receita = Categoria.recuperar_categorias_por_tipo(session["id_usuario"], "Receita")

        return render_template("categorias.html", categorias_despesa=categorias_despesa, categorias_receita=categorias_receita)
    else:
        flash("Você precisa estar logado para acessar as categorias!", "error")
        return redirect('/login')


# cadastra uma nova categoria
@app.route("/categorias/criar", methods=["POST"])
def adicionar_categoria():
    if "usuario" in session:
        # recebe os dados da categoria
        nome = request.form.get("nome")
        tipo = request.form.get("tipo")

        # converte o tipo para o formato do banco
        if tipo == "SAIDA":
            tipo = "Despesa"
        elif tipo == "ENTRADA":
            tipo = "Receita"
        emoji = request.form.get("emoji")
        cor = request.form.get("cor")

        # verifica se todos os campos foram preenchidos
        if not nome or not tipo or not emoji or not cor:
            flash("Todos os campos são obrigatórios!", "error")
            return redirect('/categorias')

        # salva a categoria
        categoria_criada = Categoria.criar_categoria(session["id_usuario"], nome, tipo, emoji, cor)

        if categoria_criada:
            flash("Categoria criada com sucesso!", "success")
        else:
            flash("Erro ao criar categoria. Tente novamente.", "error")

        return redirect('/categorias')
    else:
        flash("Você precisa estar logado para adicionar categorias!", "error")
        return redirect('/login')


# exclui uma categoria
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


# atualiza os dados de uma categoria
@app.route("/categorias/atualizar/", methods=["POST"])
def atualizar_categoria():
    if "usuario" not in session:
        flash("Você precisa estar logado para atualizar categorias!", "error")
        return redirect(url_for("index"))

    # recebe os dados atualizados
    id_categoria = request.form.get("id_categoria")
    nome = request.form.get("nome")
    tipo = request.form.get("tipo")
    emoji = request.form.get("emoji")
    cor = request.form.get("cor")

    # converte o tipo para o formato do banco
    if tipo == "SAIDA":
        tipo = "Despesa"
    elif tipo == "ENTRADA":
        tipo = "Receita"

    # verifica se os campos foram preenchidos
    if not id_categoria or not nome or not tipo or not emoji or not cor:
        flash("Todos os campos são obrigatórios!", "error")
        return redirect(url_for("/categorias"))

    # salva as alterações da categoria
    categoria_atualizada = Categoria.atualizar_categoria(
        id_categoria, nome, tipo, emoji, cor
    )

    if categoria_atualizada:
        flash("Suas alterações foram salvas com sucesso!", "success")
    else:
        flash("Não foi possível atualizar a categoria. Tente novamente.", "error")

    return redirect(url_for("categorias"))


# exibe a página de cadastro
@app.get("/cadastro")
def cadastro():
    if "usuario" in session:
        return redirect('/dashboard')
    else:
        return render_template("cadastro.html")


# cadastra um novo usuário
@app.route("/cadastro/usuario", methods=["POST"])
def cadastrar():
    # recebe os dados do formulário
    nome = request.form.get("nome")
    email = request.form.get("email")
    senha = request.form.get("senha")
    confirmar_senha = request.form.get("confirmar_senha")
    foto_perfil = request.form.get("foto_perfil") or "https://placehold.co/400x400"

    # verifica os campos obrigatórios
    if not nome or not email or not senha:
        flash("Todos os campos são obrigatórios!", "error")
        return redirect('/cadastro')

    # cria o usuário no banco de dados
    usuario_criado = Usuario.criar_usuario(nome, email, senha, foto_perfil)

    if usuario_criado:
        return redirect('/login')
    else:
        flash("Erro ao cadastrar usuário. Tente novamente.", "error")
        return redirect('/cadastro')


# exibe a página de redefinição de senha
@app.get("/redefinir")
def redefinir():
    


    return render_template("redefinir_senha.html")
    



@app.post("/api/recuperacao/enviar-codigo")
def solicitar_codigo():
    dados = request.get_json(silent=True) or {}
    email = dados.get("email", "").strip()

    if not email:
        return {"message": "Informe seu e-mail."}, 400

    usuario = Usuario.buscar_por_email(email)


    if not usuario:
        return {
            "message": "Se o e-mail estiver cadastrado, você receberá um código."
        }, 200

    codigo = f"{secrets.randbelow(1000000):06d}"

    mensagem = Message(
        subject="Código de recuperação - Duckfy",
        recipients=[email],
        sender=os.getenv("BREVO_EMAIL_REMETENTE"),
        body=(
            f"Olá!\n\n"
            f"Seu código de recuperação de senha do Duckfy é: {codigo}\n\n"
            f"Ele expira em 10 minutos.\n"
            f"Se você não solicitou essa alteração, ignore este e-mail."
        )
    )

    try:
        mail.send(mensagem)

        codigos_recuperacao[email] = {
            "codigo": codigo,
            "expira_em": datetime.now() + timedelta(minutes=10)
        }

        return {
            "message": "Se o e-mail estiver cadastrado, você receberá um código."
        }, 200

    except Exception as erro:
        print(f"Erro ao enviar e-mail pela Brevo: {erro}")
        return {
            "message": "Não foi possível enviar o e-mail. Tente novamente."
        }, 500
    

@app.post("/api/recuperacao/verificar-codigo")
def verificar_codigo():
    dados = request.get_json(silent=True) or {}

    email = dados.get("email", "").strip()
    codigo_digitado = dados.get("codigo", "").strip()

    if not email or not codigo_digitado:
        return {"message": "Informe o código recebido."}, 400

    recuperacao = codigos_recuperacao.get(email)

    if not recuperacao:
        return {"message": "Solicite um novo código de recuperação."}, 400

    # Verifica se o código expirou
    if datetime.now() > recuperacao["expira_em"]:
        codigos_recuperacao.pop(email, None)
        return {"message": "O código expirou. Solicite um novo."}, 400

    # Confere o código digitado
    if not secrets.compare_digest(codigo_digitado, recuperacao["codigo"]):
        return {"message": "Código incorreto. Tente novamente."}, 400

    # gera token para autorizar a próxima etapa
    token = secrets.token_urlsafe(32)

    recuperacao["token"] = token
    recuperacao["token_expira_em"] = datetime.now() + timedelta(minutes=10)

    return {
    "message": "Código verificado com sucesso!",
    "reset_token": token
}, 200

@app.get("/teste-email")
def teste_email():
    try:
        mensagem = Message(
            subject="Teste de e-mail - Duckfy",
            recipients=[os.getenv("EMAIL_REMETENTE")],
            body="Teste de envio do Duckfy."
        )

        mail.send(mensagem)
        return "E-mail de teste enviado!"

    except Exception as erro:
        print(f"Erro ao enviar e-mail: {erro}")
        return f"Falha no envio: {erro}", 500




# inicia o servidor flask
if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=8080)