import math

from flask import Flask, render_template, request, redirect, session, flash, url_for
from model.categorias import Categoria
from model.usuarios import Usuario
from model.extrato import Extrato
from model.contas_bancarias import ContaBancaria
from model.reserva_emergencia import ReservaEmergencia



app = Flask(__name__)
app.secret_key = "duckfy999"

@app.get("/")
@app.get("/login")
def index():

    if "usuario" in session:
        return redirect("/dashboard")
    
    
    return render_template("tela_login.html")

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
    return render_template("termos.html")

@app.route('/privacidade')
def privacidade():
    return render_template("privacidade.html")

@app.route('/contas')
def contas():
    if "usuario" not in session:
        flash("Você precisa estar logado para acessar as contas!", "error")
        return redirect('/login')

    id_usuario = session.get('id_usuario', 1)

    # 1. Busca todas as contas usando a model
    lista_contas = ContaBancaria.buscar_todas_por_usuario(id_usuario)

    # 2. Calcula o património total das contas
    total_contas = ContaBancaria.calcular_patrimonio_total(id_usuario)

    # 3. Busca a reserva de emergência usando a model de reservas
    reserva = ReservaEmergencia.buscar_por_usuario(id_usuario)
    total_reserva = float(reserva['valor_atual']) if reserva else 0.0

    # 4. Formata os valores monetários para o padrão brasileiro (R$ 0,00)
    patrimonio_fmt = f"{total_contas:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.')
    reserva_fmt = f"{total_reserva:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.')

    return render_template(
        'contas.html',
        contas_bancarias=lista_contas,
        patrimonio_total=patrimonio_fmt,
        reserva_total=reserva_fmt
    )


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
        saldo_atual = float(saldo_texto)
    except ValueError:
        flash("Informe um saldo válido.", "error")
        return redirect('/contas')
    if not math.isfinite(saldo_atual):
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
        flash("Erro ao atualizar a conta. Tente novamente.", "error")

    return redirect('/contas')


@app.get("/reserva_emergencia")
def reserva_emergencia():
    if "usuario" not in session:
        flash("Você precisa estar logado para acessar a reserva de emergência!", "error")
        return redirect('/login')

    id_usuario = session.get('id_usuario', 1)
    
    # Procura os dados da reserva do utilizador logado
    reserva = ReservaEmergencia.buscar_por_usuario(id_usuario)

    valor_atual = float(reserva['valor_atual']) if reserva else 0.0
    meta_valor = float(reserva['meta_valor']) if reserva else 0.0

    # Calcula a percentagem de progresso para preencher a barra no HTML (máximo 100%)
    progresso_percentual = 0
    if meta_valor > 0:
        progresso_percentual = min(round((valor_atual / meta_valor) * 100, 1), 100)

    return render_template(
        "reserva_emergencia.html",
        reserva=reserva,
        valor_atual=valor_atual,
        meta_valor=meta_valor,
        progresso=progresso_percentual
    )


@app.get('/dashboard')
def dashboard():
    if "usuario" in session:
        return render_template("dashboard.html")
    else:
        flash("Você precisa estar logado para acessar o dashboard!", "error")
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


@app.get("/editar-perfil")
def editar_perfil():
    if "usuario" in session:
        return render_template("editar_perfil.html")
    else:
        flash("Você precisa estar logado para editar o seu perfil!", "error")
        return redirect('/login')

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
        flash("Você precisa estar logado para realizar lançamentos!", "error")
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



if __name__ == "__main__":
    app.run(debug=True)
