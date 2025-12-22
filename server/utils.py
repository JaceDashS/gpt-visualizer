import numpy as np
from sklearn.decomposition import PCA


def generate_response(llama, user_input: str, max_tokens: int = 512):
    """GGUF 모델로 응답 생성"""
    messages = [
        {"role": "system", "content": "Respond in one sentence, about 10 words."},
        {"role": "user", "content": user_input},
    ]
    response = llama.create_chat_completion(
        messages=messages,
        max_tokens=max_tokens,
        temperature=0.7,
    )
    return response["choices"][0]["message"]["content"].strip()


def format_vector(vec, show_first=5):
    """벡터를 포맷: 앞 5개만 보여주고 나머지 생략, 전체 차원 표시"""
    if isinstance(vec, list):
        total_dim = len(vec)
        first_vals = [f"{v:.4f}" for v in vec[:show_first]]
        if total_dim > show_first:
            return f"[{', '.join(first_vals)}, ...] (dim={total_dim})"
        return f"[{', '.join(first_vals)}] (dim={total_dim})"
    return str(vec)


def extract_embeddings(embeddings):
    """임베딩 리스트에서 실제 벡터 추출"""
    result = []
    for emb in embeddings:
        if isinstance(emb, list) and len(emb) > 0:
            if isinstance(emb[0], list):
                result.append(emb[0])
            else:
                result.append(emb)
        else:
            result.append(emb)
    return np.array(result)


def apply_pca_and_normalize(input_embeddings, output_embeddings):
    """임베딩에 PCA 적용 후 정규화"""
    # 임베딩을 numpy 배열로 변환
    input_emb_array = extract_embeddings(input_embeddings)
    output_emb_array = extract_embeddings(output_embeddings)
    
    # 입력과 출력 임베딩 결합
    all_embeddings = np.vstack([input_emb_array, output_emb_array])
    
    # PCA로 3차원으로 축소
    pca = PCA(n_components=3)
    low_dim_vectors = pca.fit_transform(all_embeddings)
    
    # -1과 1 사이로 정규화 (Min-Max 정규화)
    min_vals = low_dim_vectors.min(axis=0)
    max_vals = low_dim_vectors.max(axis=0)
    ranges = max_vals - min_vals
    ranges[ranges == 0] = 1  # 범위가 0인 경우 1로 설정
    
    # Min-Max 정규화: (x - min) / (max - min) * 2 - 1
    normalized_vectors = 2 * (low_dim_vectors - min_vals) / ranges - 1
    
    return normalized_vectors, all_embeddings.shape[1]

