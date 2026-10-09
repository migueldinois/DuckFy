from flask import Flask, render_template, request, redirect, session, flash, url_for
from database.conexao import Conexao
from model.usuarios import Usuario
from model.extrato import Extrato

app = Flask(__name__)
app.secret_key = "duckfy999"

@app.get("/")
@app.get("/login")
def index():

    if "usuario" in session:
        return redirect("/admin")
    
    
    return render_template("tela_login.html")

@app.post("/login/usuario")
def logar():
    
    input_email = request.form.get("email")
    input_senha = request.form.get("senha")
    usuario_logado = Usuario.validar_usuario(input_email, input_senha)

    if usuario_logado:
        session["usuario"] = usuario_logado
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
    usuario = {
        "nome": "Usuário",
        "foto_perfil": None,
        "dias_ofensiva": 0,
        "pontos_xp": 0,
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

    id_usuario = session.get('id_usuario', 1)

    id_conta = request.args.get('id_conta', type=int)
    data_inicio = request.args.get('data_inicio')
    data_fim = request.args.get('data_fim')

    lista_transacoes = Extrato.obter_extrato(id_usuario, id_conta, data_inicio, data_fim)

    return render_template("extrato.html", transacoes=lista_transacoes)      


@app.get("/lancamento")
def lancamento():
    if "usuario" in session:
        return render_template("lancamentos.html")
    else:
        flash("Você precisa estar logado para realizar lançamentos!", "error")
        return redirect('/login')


@app.get("/cadastro")
def cadastro():
    return render_template("tela_cadastro.html")

if __name__ == "__main__":
    app.run(debug=True)
