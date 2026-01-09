chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GENERATE_PR_DESCRIPTION') {
    handleGeneratePR(message, sender)
      .then(sendResponse)
      .catch((error) => sendResponse({ error: error.message }));
    return true;
  }
});

async function handleGeneratePR(
  _message: unknown,
  _sender: chrome.runtime.MessageSender
): Promise<{ description?: string; error?: string }> {
  return { description: 'TODO: Implement PR generation' };
}

export {};
