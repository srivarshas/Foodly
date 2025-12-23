export default function Timeline({ steps }) {
  return (
    <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-z-10 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-primary before:to-gray-200">
      {steps.map((step, i) => (
        <div key={i} className="relative flex items-center gap-6">
          <div className={`w-10 h-10 rounded-full border-4 border-white shadow-md flex items-center justify-center text-sm ${step.done ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400'}`}>
            {step.done ? "✓" : i + 1}
          </div>
          <div>
            <p className={`font-bold ${step.done ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</p>
            <p className="text-xs text-gray-500">{step.time}</p>
          </div>
        </div>
      ))}
    </div>
  );
}