from database.conexao import Conexao

import requests

class SimuladorPatrimonio:
    @staticmethod
    def obter_taxa_selic_bcb() -> float:
        """
        Busca a taxa Selic acumulada nos últimos 12 meses via API do Banco Central.
        Série 4390 do SGS (Sistema Gerenciador de Séries Temporais).
        Retorna a taxa em formato decimal (ex: 0.1075 para 10.75%).
        """
        url = "https://api.bcb.gov.br/dados/serie/bcdata.sgs.1178/dados/ultimos/1?formato=json"
        
        try:
            # Timeout de 3 segundos para evitar lentidão na página
            response = requests.get(url, timeout=3)

            #  verifica se a requisição foi bem-sucedida
            
            if response.status_code == 200: 
                dados = response.json()
                
                if dados and len(dados) > 0:
                    # O BCB retorna o valor como string no formato "10.75"
                    taxa_percentual = float(dados[0]["valor"])
                    return taxa_percentual / 100.0  # Converte % em decimal
        except Exception as e:
            print(f"[Aviso Simulador] Não foi possível consultar a API do BCB: {e}")

        # Retorno de segurança (Fallback de 10.0% a.a.) caso a API falhe
        return 0.10

    @staticmethod
    def calcular_simulacao(aporte_inicial=0.0, aporte_mensal=0.0, anos=5, taxa_anual=None):
        # Se a taxa anual não for informada via parâmetro, busca no Banco Central
        if taxa_anual is None:
            taxa_anual = SimuladorPatrimonio.obter_taxa_selic_bcb()

        # Converte a taxa anual para a taxa mensal equivalente
        taxa_mensal = (1 + taxa_anual) ** (1 / 12) - 1
        total_meses = anos * 12
        
        saldo_acumulado = aporte_inicial
        total_investido = aporte_inicial
        
        labels = []
        investido_grafico = []
        patrimonio_grafico = []

        for mes in range(1, total_meses + 1):
            saldo_acumulado += saldo_acumulado * taxa_mensal
            saldo_acumulado += aporte_mensal
            total_investido += aporte_mensal

            if mes % 12 == 0:
                ano_atual = mes // 12
                labels.append(f"{ano_atual} ano(s)")
                investido_grafico.append(round(total_investido, 2))
                patrimonio_grafico.append(round(saldo_acumulado, 2))

        rendimentos = saldo_acumulado - total_investido

        return {
            "taxa_anual_aplicada": round(taxa_anual * 100, 2),  # Retorna a % para exibir no HTML se desejar
            "total_investido": round(total_investido, 2),
            "rendimentos": round(rendimentos, 2),
            "patrimonio_final": round(saldo_acumulado, 2),
            "grafico": {
                "labels": labels,
                "investido": investido_grafico,
                "patrimonio": patrimonio_grafico
            }
        }

    