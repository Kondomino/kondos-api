Awesome! Now lets focus on the architecture of our Agentic module.
It will be responsible for instantiating our Grok AI model via Langgraph/Langgchain, so lets use the oficial package for that.
Docs: @https://js.langchain.com/docs/how_to/installation/ 

I've already added the package via pnpm add langchain @langchain/core .

Now, please provide a detailed plan for that:

- We need a Receptionist agent. He'll be responsible for analyzing if the person that just messaged is indeed a real state agent. He can do that by using a tool to fetch the conversations in db, and if not enought to dermine, he must ask the person (always in a very humanized way, always in portuguese), who the person is.
- After deciding if the person/phone number is not a real state agent (corretor imobiliario), he must save it on the cache module we just installed
- lets have our main agent Chatty
- Chatty must have a simple functional tool for fetching the conversations in postgres, making sure he always have the full history of that person available
- and another tool for Chatty for persisting the message in async way, after receiving a relevant message (non relevant things like normal chats or cumpliments should be discarted)
- Chatty's initial prompt should be: "You are a specialist agent, very good with human social interactions, that works for Kondo, our disruptive real state platform in Brazil that leverages AI to help people find their best places to live or invest. Your task is to keep conversations with real state agents