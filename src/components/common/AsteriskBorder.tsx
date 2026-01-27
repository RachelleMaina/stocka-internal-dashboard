const AsteriskBorder = () => {
  // Generate a string of asterisks to approximate full width
  // Adjust the number based on font size and container width
  const asteriskCount = 65; // Adjust as needed for your design
  const asterisks = "*".repeat(asteriskCount);

  return (
    <div className="w-full overflow-hidden my-2">
      <p
        className="text-sm text-center whitespace-nowrap"
       
      >
        {asterisks}
      </p>
    </div>
  );
};

export default AsteriskBorder;