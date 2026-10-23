import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

class Conexao():
    @staticmethod
    def conectar():
        BD_AMBIENTE = os.getenv("BD_AMBIENTE", "local")
        
        if BD_AMBIENTE == "local":
            conexao = mysql.connector.connect(
                host="localhost",
                port=3306,
                user="root",
                password="root",
                database="duckfy"
            )
        elif BD_AMBIENTE == "online":
            porta_env = os.getenv("BD_PORTA", "3306").strip()
            porta = int(porta_env) if porta_env else 3306

            conexao = mysql.connector.connect(
                host=os.getenv("BD_HOST"),
                port=porta,  
                user=os.getenv("BD_USUARIO"),
                password=os.getenv("BD_SENHA"),
                database=os.getenv("BD_DATABASE")
            )

        # Entrega as colunas como dicionário (chave: valor)
        cursor = conexao.cursor(dictionary=True)
        return conexao, cursor
