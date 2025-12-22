from pydantic import BaseModel


class VisualizeRequest(BaseModel):
    input_text: str


class TokenVector(BaseModel):
    token: str
    destination: list[float]  # [x, y, z] 목적지 좌표
    is_input: bool      # 입력 토큰인지 출력 토큰인지


class VisualizeResponse(BaseModel):
    tokens: list[TokenVector]  # 토큰과 벡터 정보가 함께 묶인 배열

