from flask import Flask, render_template, request, redirect, session, flash, url_for
from database.conexao import Conexao
from model.usuarios import Usuario

app = Flask(__name__)
app.secret_key = "duckfy999"

@app.get("/")
@app.get("/login")
def index():

    if "usuario" in session:
        return redirect("/dashboard")

    return render_template("tela_login.html")

@app.route("/login/usuario", methods=["POST"])
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

@app.get("/perfil")
def perfil():
    if "usuario" in session:
        return render_template("perfil.html")
    else:
        flash("Você precisa estar logado para acessar o seu perfil!", "error")
        return redirect('/login')


@app.get("/editar-perfil")
def editar_perfil():
    if "usuario" in session:
        return render_template("editar_perfil.html")
    else:
        flash("Você precisa estar logado para editar o seu perfil!", "error")
        return redirect('/login')

@app.get("/extrato")
def tela_extrato():
    if "usuario" in session:
        return render_template("extrato.html")
    else:
        flash("Você precisa estar logado para acessar o extrato!", "error")
        return redirect('/login')


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


@app.get("/cadastro")
def cadastro():
    return render_template("tela_cadastro.html")

if __name__ == "__main__":
    app.run(debug=True)
