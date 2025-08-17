export default function Footer() {
  return (
    <footer className="border-t">
      <div className="container mx-auto px-4 py-6">
        <p className="text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} AR Toolkit. Built with creativity.
        </p>
      </div>
    </footer>
  );
}
