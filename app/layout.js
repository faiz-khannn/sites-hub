import "./globals.css";

export const metadata = {
  title: "Sites — Index",
  description: "A live index of every site I've built.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <div id="app-root">{children}</div>
      </body>
    </html>
  );
}
