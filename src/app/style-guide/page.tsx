import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Divider } from "@/components/ui/Divider";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

function Swatch({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between gap-4 rounded-[calc(var(--radius)-6px)] border border-[rgb(var(--border))] bg-[rgba(var(--fg),0.02)] px-4 py-3">
            <div className="text-sm font-medium">{label}</div>
            <div className="flex items-center gap-3">
                <div
                    className="h-7 w-7 rounded-full border border-[rgb(var(--border))]"
                    style={{ background: `rgb(var(${value}))` }}
                />
                <div className="font-mono text-xs text-[rgb(var(--muted))]">{value}</div>
            </div>
        </div>
    );
}

export default function StyleGuidePage() {
    return (
        <div className="min-h-screen bg-[rgb(var(--bg))]">
            <header className="border-b border-[rgb(var(--border))] bg-[rgba(var(--bg),0.85)] backdrop-blur">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
                    <div className="flex flex-col">
                        <div className="text-base font-semibold tracking-[-0.01em]">Design system</div>
                        <div className="text-sm text-[rgb(var(--muted))]">Tokens, components, and usage patterns</div>
                    </div>
                    <Link
                        href="/"
                        className="h-10 rounded-[calc(var(--radius)-6px)] px-4 text-sm font-medium text-[rgb(var(--fg))] transition-[background-color,color] duration-150 ease-out hover:bg-[rgba(var(--fg),0.05)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--bg))]"
                    >
                        Back to app
                    </Link>
                </div>
            </header>

            <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Typography</CardTitle>
                            <CardDescription>Use weight + whitespace for hierarchy.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-3">
                            <div className="text-3xl font-semibold tracking-[-0.02em]">Heading</div>
                            <div className="text-lg font-semibold tracking-[-0.01em]">Section title</div>
                            <div className="text-sm text-[rgb(var(--muted))]">
                                Supporting text stays muted for contrast and scannability.
                            </div>
                            <Divider />
                            <div className="text-xs text-[rgb(var(--muted-2))]">
                                Body defaults to system UI font stack. Prefer text-sm for dense UI controls.
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Color tokens</CardTitle>
                            <CardDescription>All components use CSS variables from globals.css.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-3">
                            <Swatch label="Background" value="--bg" />
                            <Swatch label="Foreground" value="--fg" />
                            <Swatch label="Muted" value="--muted" />
                            <Swatch label="Border" value="--border" />
                            <Swatch label="Primary" value="--primary" />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Buttons</CardTitle>
                            <CardDescription>Variants include primary, secondary, ghost, and danger.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-wrap gap-2">
                            <Button variant="primary">Primary</Button>
                            <Button variant="secondary">Secondary</Button>
                            <Button variant="ghost">Ghost</Button>
                            <Button variant="danger">Danger</Button>
                            <Button variant="secondary" disabled>
                                Disabled
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Inputs</CardTitle>
                            <CardDescription>Accessible focus rings and consistent spacing.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-3">
                            <Input placeholder="Text input" />
                            <Select defaultValue="20">
                                <option value="10">10</option>
                                <option value="20">20</option>
                                <option value="50">50</option>
                            </Select>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Badges</CardTitle>
                            <CardDescription>Status indicators with clear contrast.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-wrap gap-2">
                            <Badge>Neutral</Badge>
                            <Badge variant="success">Success</Badge>
                            <Badge variant="danger">Danger</Badge>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Spacing scale</CardTitle>
                            <CardDescription>Use a consistent rhythm to keep alignment tight.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-3">
                            {[
                                { name: "2", desc: "tight gaps" },
                                { name: "3", desc: "control groups" },
                                { name: "4", desc: "section spacing" },
                                { name: "6", desc: "layout gutters" },
                            ].map((x) => (
                                <div
                                    key={x.name}
                                    className="rounded-[calc(var(--radius)-6px)] border border-[rgb(var(--border))] bg-[rgba(var(--fg),0.02)] p-4"
                                >
                                    <div className="text-sm font-semibold">gap-{x.name}</div>
                                    <div className="mt-1 text-sm text-[rgb(var(--muted))]">{x.desc}</div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                <div className="mt-10 text-sm text-[rgb(var(--muted))]">
                    Full written style guide lives in docs/style-guide.md.
                </div>
            </main>
        </div>
    );
}

