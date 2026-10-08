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
    usuario = {
        "nome": "Usuário",
        "foto_perfil": None,
        "dias_ofensiva": 0,
        "pontos_xp": 0,
    }
    return render_template("perfil.html", usuario=usuario)


@app.get("/editar-perfil")
def editar_perfil():
    return render_template("editar_perfil.html")

@app.get("/extrato")
def tela_extrato():
    return render_template("extrato.html")




if __name__ == "__main__":
    app.run(debug=True)
