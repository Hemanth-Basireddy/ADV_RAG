from langchain_core.messages import HumanMessage, AIMessage
from src.rag_pipeline import rag_chain

store = {}

def get_session_history(session_id):
    if session_id not in store:
        store[session_id] = []
    return store[session_id]

session_id = "user_1"
chat_history = get_session_history(session_id)

print("\\nWelcome To Conversational RAG Chatbot")
print("\\nType exit to Stop the Chatbot")

while True:
    question = input("\\nYou: ")

    if question.lower() == "exit":
        print("Exiting from Chatbot...")
        break

    answer = rag_chain.invoke({
        "input": question,
        "chat_history": chat_history[-10:]
    })

    print("\\nAI:", answer)

    chat_history.append(HumanMessage(content=question))
    chat_history.append(AIMessage(content=answer))
