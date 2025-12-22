from fastapi import HTTPException
from model import llama
from schemas import VisualizeRequest, VisualizeResponse, TokenVector
from utils import generate_response, format_vector, apply_pca_and_normalize


async def visualize(request: VisualizeRequest):
    """Visualize endpoint - 모델로 응답 생성 후 임베딩 추출 및 PCA로 3차원 축소"""
    
    # 모델이 로드되어 있는지 확인하고, 없으면 로드 시도
    from model import ensure_model_loaded
    if not ensure_model_loaded():
        raise HTTPException(status_code=503, detail="모델을 로드할 수 없습니다. 잠시 후 다시 시도해주세요.")
    
    # 모델이 로드되어 있으면 응답 생성
    if llama is not None:
        try:
            generated_response = generate_response(llama, request.input_text)
            
            # 입력 텍스트의 토큰 임베딩 추출
            input_embeddings = llama.embed(request.input_text)
            input_tokens = llama.tokenize(request.input_text.encode('utf-8'))
            input_token_strs = [llama.detokenize([t]).decode('utf-8', errors='replace') for t in input_tokens]
            
            # 빈 문자열 토큰 제거, 응답 첫번쨰가 빈 문자열이 됨, 아마 특수 토큰이 출력되는데 제거하면서 비어지는 듯
            input_filtered = [(token, emb) for token, emb in zip(input_token_strs, input_embeddings) if token.strip()]
            input_token_strs = [t for t, _ in input_filtered]
            input_embeddings = [e for _, e in input_filtered]
            
            # 생성된 응답의 토큰 임베딩 추출
            output_embeddings = llama.embed(generated_response)
            output_tokens = llama.tokenize(generated_response.encode('utf-8'))
            output_token_strs = [llama.detokenize([t]).decode('utf-8', errors='replace') for t in output_tokens]
            
            # 빈 문자열 토큰 제거
            output_filtered = [(token, emb) for token, emb in zip(output_token_strs, output_embeddings) if token.strip()]
            output_token_strs = [t for t, _ in output_filtered]
            output_embeddings = [e for _, e in output_filtered]
            
            # 디버깅용 로그
            # print(f"\n{'='*60}")
            # print(f"입력: {request.input_text}")
            # print(f"생성된 응답: {generated_response}")
            
            # print(f"\n입력 토큰 임베딩 (앞 5차원):")
            # for i, (token, emb) in enumerate(zip(input_token_strs, input_embeddings)):
            #     # emb는 리스트의 리스트일 수 있음 [[token1_emb], [token2_emb], ...]
            #     if isinstance(emb, list) and len(emb) > 0:
            #         if isinstance(emb[0], list):
            #             emb_vec = emb[0]
            #         else:
            #             emb_vec = emb
            #     else:
            #         emb_vec = emb
            #     print(f"  [{i}] {repr(token):<20} {format_vector(emb_vec)}")
            # print(f"\n출력 토큰 임베딩 (앞 5차원):")
            # for i, (token, emb) in enumerate(zip(output_token_strs, output_embeddings)):
            #     # emb는 리스트의 리스트일 수 있음 [[token1_emb], [token2_emb], ...]
            #     if isinstance(emb, list) and len(emb) > 0:
            #         if isinstance(emb[0], list):
            #             emb_vec = emb[0]
            #         else:
            #             emb_vec = emb
            #     else:
            #         emb_vec = emb
            #     print(f"  [{i}] {repr(token):<20} {format_vector(emb_vec)}")
            
            # PCA 적용 및 정규화
            normalized_vectors, original_dim = apply_pca_and_normalize(input_embeddings, output_embeddings)
            all_tokens = input_token_strs + output_token_strs
            

            # 디버깅용 로그
            # print(f"\nPCA 적용: {original_dim}차원 -> 3차원")
            # print(f"정규화: 각 차원을 -1과 1 사이로 스케일링")
            # print(f"\n입력 토큰 3차원 벡터 (PCA 후, 정규화):")
            # for i in range(len(input_token_strs)):
            #     token = input_token_strs[i]
            #     vec_3d = normalized_vectors[i]
            #     print(f"  [{i}] {repr(token):<20} [{vec_3d[0]:.4f}, {vec_3d[1]:.4f}, {vec_3d[2]:.4f}]")
            # print(f"\n출력 토큰 3차원 벡터 (PCA 후, 정규화):")
            # for i in range(len(output_token_strs)):
            #     token = output_token_strs[i]
            #     vec_3d = normalized_vectors[len(input_token_strs) + i]
            #     print(f"  [{i}] {repr(token):<20} [{vec_3d[0]:.4f}, {vec_3d[1]:.4f}, {vec_3d[2]:.4f}]")
            # print(f"{'='*60}\n")
            
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
            
            return VisualizeResponse(tokens=tokens_data)
            
        except Exception as e:
            print(f"[ERROR] 응답 생성 실패: {e}")
            import traceback
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=f"임베딩 추출 중 오류 발생: {str(e)}")
    else:
        print("[ERROR] 모델이 로드되지 않아 응답을 생성할 수 없습니다.")
        raise HTTPException(status_code=500, detail="모델이 로드되지 않았습니다.")

