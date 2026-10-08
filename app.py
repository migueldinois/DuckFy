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

@app.get("/extrato")
def tela_extrato():
    return render_template("extrato.html")

@app.get("/lancamento")
def lancamento():
    return render_template("lancamentos.html")

@app.get("/categorias")
def categorias():
    return render_template("categorias.html")



if __name__ == "__main__":
    app.run(debug=True)
