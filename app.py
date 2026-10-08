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

def obter_extrato(id_usuario: int, id_conta: int = None, data_inicio: str = None, data_fim: str = None):
    
    return render_template("extrato.html")


if __name__ == "__main__":
    app.run(debug=True)
