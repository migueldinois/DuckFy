from flask import Flask, render_template


app = Flask(__name__)



@app.get("/")
def index():
    return render_template("index.html")

@app.get('/dashboard')
def dashboard():
    return render_template("dashboard.html")

@app.get("/perfil")
def perfil():
    return render_template("perfil.html")


@app.get("/editar-perfil")
def editar_perfil():
    return render_template("editar_perfil.html")

@app.get("/login")
def login():
    return render_template("tela_login.html")

@app.get("/reserva_emergencia")
def reserva_emergencia():
    return render_template("reserva_emergencia.html")



if __name__ == "__main__":
    app.run(debug=True)
