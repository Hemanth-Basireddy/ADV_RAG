import logging
import threading

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from langchain_core.messages import AIMessage, HumanMessage
from pydantic import BaseModel, Field

from src.rag_pipeline import rag_chain

logger = logging.getLogger(__name__)
app = FastAPI(title="Conversational RAG API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

session_histories: dict[str, list[HumanMessage | AIMessage]] = {}
session_lock = threading.Lock()


class ChatRequest(BaseModel):
    session_id: str = Field(min_length=1, max_length=128)
    message: str = Field(min_length=1, max_length=10000)


class ChatResponse(BaseModel):
    session_id: str
    answer: str


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/chat", response_model=ChatResponse)
def chat(request: ChatRequest) -> ChatResponse:
    question = request.message.strip()
    if not question:
        raise HTTPException(status_code=422, detail="Message cannot be empty.")

    with session_lock:
        history = session_histories.setdefault(request.session_id, [])
        try:
            answer = rag_chain.invoke(
                {
                    "input": question,
                    "chat_history": history[-10:],
                }
            )
        except Exception as exc:
            logger.exception("RAG request failed")
            raise HTTPException(
                status_code=502,
                detail="The assistant could not complete this request. Please try again.",
            ) from exc

        if not isinstance(answer, str) or not answer.strip():
            logger.error("RAG chain returned an empty or invalid response")
            raise HTTPException(
                status_code=502,
                detail="The assistant returned an empty response. Please try again.",
            )

        history.extend(
            [
                HumanMessage(content=question),
                AIMessage(content=answer),
            ]
        )

    return ChatResponse(session_id=request.session_id, answer=answer)
