export function Popup() {
  const openOptions = () => {
    chrome.runtime.openOptionsPage();
  };

  return (
    <div className="w-64 p-4 bg-white">
      <h1 className="text-lg font-bold text-gray-900 mb-2">PR Bot</h1>
      <p className="text-sm text-gray-600 mb-4">
        Auto-generate PR descriptions using AI
      </p>
      <button
        onClick={openOptions}
        className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Open Settings
      </button>
    </div>
  );
}
