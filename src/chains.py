from langchain_core.output_parsers import StrOutputParser
from src.config import llm
from src.prompts import (
    intent_prompt,
    contextualize_prompt,
    answer_prompt,
    history_prompt,
    general_prompt
)

intent_chain = intent_prompt | llm | StrOutputParser()

contextualize_chain = contextualize_prompt | llm | StrOutputParser()

document_answer_chain = answer_prompt | llm | StrOutputParser()

history_answer_chain = history_prompt | llm | StrOutputParser()

general_chain = general_prompt | llm | StrOutputParser()
