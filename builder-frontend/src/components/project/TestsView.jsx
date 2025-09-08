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
        <p>{test}</p>
      ))}
    </div>
  );
}

export default TestsView;
