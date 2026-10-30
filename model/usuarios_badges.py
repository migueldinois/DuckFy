from model.progresso import Progresso


class UsuarioBadge:
    @staticmethod
    def listar_conquistas_usuario(id_usuario):
        return Progresso.sincronizar_conquistas(id_usuario)
