function TestsView() {
  const tests = [
    "Lives In Philly, $200k income",
    "Lives In Allentown, $200k income",
    "Lives In NYC, $15k income",
    "Lives In Philly, $50k income",
  ];

  return (
    <div className="p-3">
      <h1>All Tests</h1>
      {tests.map((test) => (
        <div className="border-1 px-4 p-2 mb-4 flex justify-between items-center">
          <span>{test}</span>
          <div className="flex gap-2">
            <button className="border-1 rounded-2xl border-green-500 bg-green-100 font-medium text-green-900 px-3 py-1">
              Run
            </button>
            <button className="border-1 border-gray-500 bg-gray-100 font-medium text-gray-900 px-3 py-1">
              Expand
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default TestsView;
