export function Footer() {
  return (
    <footer className="bg-gray-900 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between md:flex-row">
          <div className="flex items-center">
            <span className="text-2xl font-bold text-white">Apex v2</span>
          </div>
          <p className="mt-4 text-gray-400 md:mt-0">
            © 2026 Apex v2. All rights reserved.
          </p>
          <div className="mt-4 flex space-x-6 md:mt-0">
            <a href="/privacy" className="text-gray-400 hover:text-white">
              Privacy
            </a>
            <a href="/terms" className="text-gray-400 hover:text-white">
              Terms
            </a>
            <a href="/contact" className="text-gray-400 hover:text-white">
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
