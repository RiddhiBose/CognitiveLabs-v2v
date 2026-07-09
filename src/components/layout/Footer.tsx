import { APP_NAME } from '../../constants';

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white py-4 text-center text-xs text-gray-400">
      &copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.
    </footer>
  );
}
