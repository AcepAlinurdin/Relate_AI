export default function ChatWidgetPage() {
    return (
        <div className="flex h-screen items-center justify-center bg-transparent">
            <div className="w-full max-w-sm rounded-lg border bg-background shadow-lg overflow-hidden">
                <div className="bg-primary p-4 text-primary-foreground">
                    <h3 className="font-bold">Chat with us</h3>
                </div>
                <div className="p-4 h-80 flex items-center justify-center text-muted-foreground">
                    Chat history will appear here.
                </div>
                <div className="p-4 border-t">
                    <input
                        className="w-full rounded-md border px-3 py-2 text-sm"
                        placeholder="Type a message..."
                    />
                </div>
            </div>
        </div>
    );
}
