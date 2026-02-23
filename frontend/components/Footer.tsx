'use client';

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <p className="text-xs text-gray-500 text-center">
          This demo processes your financial inputs locally in your browser.
        </p>
        <p className="text-xs text-gray-400 text-center mt-2">
          © {new Date().getFullYear()} Credit Scoring App
        </p>
      </div>
    </footer>
  );
}
