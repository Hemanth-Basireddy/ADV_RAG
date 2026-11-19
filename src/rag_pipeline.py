from langchain_core.runnables import RunnableLambda
from src.config import retriever
from src.chains import (
    contextualize_chain,
    document_answer_chain,
    intent_chain,
    history_answer_chain,
    general_chain
)

def retrieve_documents(inputs):
    standalone_question = contextualize_chain.invoke({
        "input": inputs["input"],
        "chat_history": inputs["chat_history"]
    })

    print("\\nRewritten Question:", standalone_question)

    documents = retriever.invoke(standalone_question)

    context = "\\n\\n".join(
        [document.page_content for document in documents]
    )

    if not context.strip():
        return "I don't know based on the provided documents."

    answer = document_answer_chain.invoke({
        "input": standalone_question,
        "context": context
    })

    return answer

def route_request(inputs):
    question = inputs["input"]
    history = inputs["chat_history"]

    intent = intent_chain.invoke({
        "input": question,
        "chat_history": history
    }).strip().upper()

    print("\\nDetected Intent:", intent)

    if intent == "DOCUMENT":
        return retrieve_documents(inputs)

    elif intent == "HISTORY":
        return history_answer_chain.invoke({
            "input": question,
            "chat_history": history
        })

    elif intent == "GENERAL":
        return general_chain.invoke({
            "input": question,
            "chat_history": history
        })

    else:
        return general_chain.invoke({
            "input": question,
            "chat_history": history
        })

rag_chain = RunnableLambda(route_request)
