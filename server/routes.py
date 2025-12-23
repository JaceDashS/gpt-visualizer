from fastapi import HTTPException
from schemas import VisualizeRequest, VisualizeResponse, TokenVector
from utils import generate_response, format_vector, apply_pca_and_normalize


async def visualize(request: VisualizeRequest):
    """Visualize endpoint - 모델로 응답 생성 후 임베딩 추출 및 PCA로 3차원 축소"""
    print(f"[VISUALIZE] 요청 수신: {request.input_text[:50]}...")
    
    # 모델이 로드되어 있는지 확인하고, 없으면 로드 시도
    from model import ensure_model_loaded, llama
    if not ensure_model_loaded():
        print("[VISUALIZE] 모델 로드 실패")
        raise HTTPException(status_code=503, detail="모델을 로드할 수 없습니다. 잠시 후 다시 시도해주세요.")
    
    # 모델이 로드되어 있으면 응답 생성
    if llama is not None:
        try:
            print("[VISUALIZE] 응답 생성 시작...")
            generated_response = generate_response(llama, request.input_text)
            print(f"[VISUALIZE] 응답 생성 완료: {generated_response[:50]}...")
            
            print("[VISUALIZE] 입력 임베딩 추출 시작...")
            # 입력 텍스트의 토큰 임베딩 추출
            input_embeddings = llama.embed(request.input_text)
            input_tokens = llama.tokenize(request.input_text.encode('utf-8'))
            input_token_strs = [llama.detokenize([t]).decode('utf-8', errors='replace') for t in input_tokens]
            print(f"[VISUALIZE] 입력 토큰 수: {len(input_token_strs)}")
            
            # 빈 문자열 토큰 제거, 응답 첫번쨰가 빈 문자열이 됨, 아마 특수 토큰이 출력되는데 제거하면서 비어지는 듯
            input_filtered = [(token, emb) for token, emb in zip(input_token_strs, input_embeddings) if token.strip()]
            input_token_strs = [t for t, _ in input_filtered]
            input_embeddings = [e for _, e in input_filtered]
            print(f"[VISUALIZE] 필터링 후 입력 토큰 수: {len(input_token_strs)}")
            
            print("[VISUALIZE] 출력 임베딩 추출 시작...")
            # 생성된 응답의 토큰 임베딩 추출
            output_embeddings = llama.embed(generated_response)
            output_tokens = llama.tokenize(generated_response.encode('utf-8'))
            output_token_strs = [llama.detokenize([t]).decode('utf-8', errors='replace') for t in output_tokens]
            print(f"[VISUALIZE] 출력 토큰 수: {len(output_token_strs)}")
            
            # 빈 문자열 토큰 제거
            output_filtered = [(token, emb) for token, emb in zip(output_token_strs, output_embeddings) if token.strip()]
            output_token_strs = [t for t, _ in output_filtered]
            output_embeddings = [e for _, e in output_filtered]
            print(f"[VISUALIZE] 필터링 후 출력 토큰 수: {len(output_token_strs)}")
            
            print("[VISUALIZE] PCA 적용 시작...")
            # PCA 적용 및 정규화
            normalized_vectors, original_dim = apply_pca_and_normalize(input_embeddings, output_embeddings)
            print(f"[VISUALIZE] PCA 완료: {original_dim}차원 -> 3차원, 벡터 수: {len(normalized_vectors)}")
            all_tokens = input_token_strs + output_token_strs
            print(f"[VISUALIZE] 전체 토큰 수: {len(all_tokens)}")
            
            print("[VISUALIZE] TokenVector 리스트 생성 시작...")
            # TokenVector 리스트 생성 (정규화된 벡터 사용)
            tokens_data = []
            for i, token in enumerate(all_tokens):
                destination = normalized_vectors[i].tolist()
                
                token_vector = TokenVector(
                    token=token,
                    destination=destination,
                    is_input=i < len(input_token_strs)
                )
                tokens_data.append(token_vector)
            
            print(f"[VISUALIZE] 응답 생성 완료, 토큰 수: {len(tokens_data)}")
            return VisualizeResponse(tokens=tokens_data)
            
        except Exception as e:
            print(f"[ERROR] 응답 생성 실패: {e}")
            import traceback
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=f"임베딩 추출 중 오류 발생: {str(e)}")
    else:
        print("[ERROR] 모델이 로드되지 않아 응답을 생성할 수 없습니다.")
        raise HTTPException(status_code=500, detail="모델이 로드되지 않았습니다.")

