"""
Visualization routes - HTTP server용 동기 함수
"""
from schemas import VisualizeRequest, VisualizeResponse, TokenVector
from utils import generate_response, format_vector, apply_pca_and_normalize


def visualize_sync(request: VisualizeRequest) -> VisualizeResponse:
    """Visualize endpoint - Generate response and extract embeddings with PCA reduction (sync version)"""
    print(f"[VISUALIZE] Request received: {request.input_text[:50]}...")
    
    # Ensure model is loaded
    from model import ensure_model_loaded, llama
    if not ensure_model_loaded():
        print("[VISUALIZE] Model load failed")
        raise RuntimeError("Model could not be loaded. Please try again later.")
    
    # 모델이 로드되어 있으면 응답 생성
    if llama is not None:
        try:
            print("[VISUALIZE] Generating response...")
            generated_response = generate_response(llama, request.input_text)
            print(f"[VISUALIZE] Response generated: {generated_response[:50]}...")
            
            print("[VISUALIZE] Extracting input embeddings...")
            # Extract token embeddings from input text
            input_embeddings = llama.embed(request.input_text)
            input_tokens = llama.tokenize(request.input_text.encode('utf-8'))
            input_token_strs = [llama.detokenize([t]).decode('utf-8', errors='replace') for t in input_tokens]
            print(f"[VISUALIZE] Input tokens: {len(input_token_strs)}")
            
            # Remove empty string tokens
            input_filtered = [(token, emb) for token, emb in zip(input_token_strs, input_embeddings) if token.strip()]
            input_token_strs = [t for t, _ in input_filtered]
            input_embeddings = [e for _, e in input_filtered]
            print(f"[VISUALIZE] Filtered input tokens: {len(input_token_strs)}")
            
            print("[VISUALIZE] Extracting output embeddings...")
            # Extract token embeddings from generated response
            output_embeddings = llama.embed(generated_response)
            output_tokens = llama.tokenize(generated_response.encode('utf-8'))
            output_token_strs = [llama.detokenize([t]).decode('utf-8', errors='replace') for t in output_tokens]
            print(f"[VISUALIZE] Output tokens: {len(output_token_strs)}")
            
            # Remove empty string tokens
            output_filtered = [(token, emb) for token, emb in zip(output_token_strs, output_embeddings) if token.strip()]
            output_token_strs = [t for t, _ in output_filtered]
            output_embeddings = [e for _, e in output_filtered]
            print(f"[VISUALIZE] Filtered output tokens: {len(output_token_strs)}")
            
            print("[VISUALIZE] Applying PCA...")
            # Apply PCA and normalize
            normalized_vectors, original_dim = apply_pca_and_normalize(input_embeddings, output_embeddings)
            print(f"[VISUALIZE] PCA completed: {original_dim}D -> 3D, vectors: {len(normalized_vectors)}")
            all_tokens = input_token_strs + output_token_strs
            print(f"[VISUALIZE] Total tokens: {len(all_tokens)}")
            
            print("[VISUALIZE] Creating TokenVector list...")
            # Create TokenVector list (using normalized vectors)
            tokens_data = []
            for i, token in enumerate(all_tokens):
                destination = normalized_vectors[i].tolist()
                
                token_vector = TokenVector(
                    token=token,
                    destination=destination,
                    is_input=i < len(input_token_strs)
                )
                tokens_data.append(token_vector)
            
            print(f"[VISUALIZE] Response completed, tokens: {len(tokens_data)}")
            return VisualizeResponse(tokens=tokens_data)
            
        except Exception as e:
            print(f"[ERROR] Response generation failed: {e}")
            import traceback
            traceback.print_exc()
            raise RuntimeError(f"Error during embedding extraction: {str(e)}")
    else:
        print("[ERROR] Model not loaded, cannot generate response")
        raise RuntimeError("Model is not loaded")
