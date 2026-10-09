from flask import Flask, render_template, request, redirect, session, flash, url_for
from database.conexao import Conexao
from model.usuarios import Usuario
from model.extrato import Extrato
from model.reserva_emergencia import Reserva


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
        return redirect(url_for("dashboard"))
    else:
        flash("Usuario ou senha invalidos!", "error")
        return redirect('/login')
    
@app.route("/logout")
def logout():
    session.pop("usuario", None)
    flash("Você saiu da sua conta!", "success")
    return redirect("/login")
    

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
        historico_movimentacoes=historico_movimentacoes
    )


@app.route('/guardar_reserva', methods=['POST'])
def guardar_reserva():
    if "usuario" not in session:
        flash("Sessão expirada. Faça login novamente.", "error")
        return redirect('/login')

    email_usuario = session.get("email")
    id_usuario = Reserva.obter_id_por_email(email_usuario)

    try:
        valor_guardar = float(request.form.get('valor', 0))
    except ValueError:
        valor_guardar = 0.0

    descricao = request.form.get('descricao', 'Depósito na Reserva')

    if valor_guardar <= 0:
        flash("Informe um valor válido maior que zero!", "error")
        return redirect(url_for('reserva_emergencia'))

    # Salva no Banco de Dados para o id_usuario correto
    Reserva.guardar_dinheiro(id_usuario, valor_guardar, descricao)

    flash(f'R$ {valor_guardar:.2f} guardados na reserva com sucesso!', 'success')
    return redirect(url_for('reserva_emergencia'))
    


@app.get("/lancamento")
def lancamento():
    if "usuario" in session:
        return render_template("lancamentos.html")
    else:
        flash("Você precisa estar logado para realizar lançamentos!", "error")
        return redirect('/login')

@app.get("/categorias")
def categorias():
    return render_template("categorias.html")


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
