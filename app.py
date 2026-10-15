from flask import Flask, render_template, request, redirect, session, flash, url_for
from database.conexao import Conexao
from model.categorias import Categoria
from model.usuarios import Usuario
from model.extrato import Extrato



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

    return
@app.get("/reserva_emergencia")
def reserva_emergencia():
    return render_template("reserva_emergencia.html")
    


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

@app.get("/cadastro")
def cadastro():
    return render_template("tela_cadastro.html")


if __name__ == "__main__":
    app.run(debug=True)
