export default function Spinner({ size = 40, color = "var(--primary)" }: { size?: number; color?: string }) {
    return (
        <div
            className="animate-spin rounded-full border-4 border-current border-t-transparent"
            style={{
                width: size,
                height: size,
                color: color,
            }}
        />
    );
}