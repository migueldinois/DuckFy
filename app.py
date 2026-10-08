from flask import Flask, render_template, request, redirect, session, flash, url_for
from database.conexao import Conexao
from model.usuarios import Usuario

app = Flask(__name__)
app.secret_key = "duckfy999"

@app.get("/")
@app.get("/login")
def index():

    conexao, cursor = Conexao.conectar()
    conexao.close()

    if "usuario" in session:
        return redirect("/admin")
    
    

    return render_template("tela_login.html")


@app.post("/login/usuario")
def logar():
    input_email = request.form.get("email", "").strip()
    input_senha = request.form.get("senha", "")

    # Validação de campos vazios
    if not input_email or not input_senha:
        flash("Preencha e-mail e senha.", "error")
        return redirect(url_for("index"))

    if Usuario.validar_usuario(input_email, input_senha):
        session["usuario"] = input_email
        flash(f"Bem vindo, {input_email}!", "success")
        return redirect(url_for("dashboard"))

    flash("Usuario ou senha invalidos!", "error")
    return redirect(url_for("index"))
    


@app.get('/dashboard')
def dashboard():
    return render_template("dashboard.html")

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
    return render_template("editar_perfil.html")

@app.get("/extrato")
def tela_extrato():
    return render_template("extrato.html")

@app.get("/lancamento")
def lancamento():
    return render_template("lancamentos.html")

@app.get("/cadastro")
def cadastro():
    return render_template("tela_cadastro.html")

if __name__ == "__main__":
    app.run(debug=True)
