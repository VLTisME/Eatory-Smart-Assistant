import React from "react";

interface MarkdownRendererProps {
	content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
	if (!content) return null;

	const lines = content.split("\n");
	const elements: React.ReactNode[] = [];

	let listItems: React.ReactNode[] = [];
	let listKey = 0;

	let inCodeBlock = false;
	let codeBlockLines: string[] = [];

	const flushList = () => {
		if (listItems.length > 0) {
			elements.push(
				<ul
					key={`list-${listKey++}`}
					className="list-none pl-0 my-2 space-y-1.5"
				>
					{listItems}
				</ul>,
			);
			listItems = [];
		}
	};

	const parseInlineStylesInner = (text: string): React.ReactNode[] => {
		const codeParts = text.split(/(`.*?`)/g);
		return codeParts.map((part, codeIndex) => {
			if (part.startsWith("`") && part.endsWith("`")) {
				return (
					<code
						key={`code-${codeIndex}`}
						className="bg-gray-100 border border-gray-200/60 px-1.5 py-0.5 rounded-md font-mono text-xs text-red-500 font-semibold"
					>
						{part.slice(1, -1)}
					</code>
				);
			}
			return part;
		});
	};

	const parseInlineStyles = (text: string): React.ReactNode[] => {
		const boldParts = text.split(/(\*\*.*?\*\*)/g);
		return boldParts.flatMap((part, boldIndex) => {
			if (part.startsWith("**") && part.endsWith("**")) {
				const innerText = part.slice(2, -2);
				return (
					<strong
						key={`bold-${boldIndex}`}
						className="font-bold text-gray-900"
					>
						{parseInlineStylesInner(innerText)}
					</strong>
				);
			}
			return parseInlineStylesInner(part);
		});
	};

	lines.forEach((line, index) => {
		const trimmedLine = line.trim();

		// Handle multi-line code blocks
		if (trimmedLine.startsWith("```")) {
			flushList();
			if (inCodeBlock) {
				// End of code block
				elements.push(
					<pre
						key={`pre-${index}`}
						className="bg-gray-50 border border-gray-100 rounded-xl p-3 my-2 font-mono text-xs overflow-x-auto text-gray-800 shadow-inner"
					>
						<code className="block leading-relaxed">
							{codeBlockLines.join("\n")}
						</code>
					</pre>,
				);
				codeBlockLines = [];
				inCodeBlock = false;
			} else {
				inCodeBlock = true;
			}
			return;
		}

		if (inCodeBlock) {
			codeBlockLines.push(line);
			return;
		}

		// Horizontal Rule
		if (trimmedLine === "---") {
			flushList();
			elements.push(
				<hr
					key={`hr-${index}`}
					className="my-3.5 border-t border-gray-200/80"
				/>,
			);
			return;
		}

		// Headings
		if (trimmedLine.startsWith("### ")) {
			flushList();
			elements.push(
				<h3
					key={`h3-${index}`}
					className="text-[15px] font-bold text-gray-900 mt-3.5 mb-1.5 flex items-center gap-1.5 leading-snug"
				>
					{parseInlineStyles(trimmedLine.slice(4))}
				</h3>,
			);
			return;
		}
		if (trimmedLine.startsWith("## ")) {
			flushList();
			elements.push(
				<h2
					key={`h2-${index}`}
					className="text-base font-bold text-gray-900 mt-4.5 mb-2 flex items-center gap-1.5 leading-snug"
				>
					{parseInlineStyles(trimmedLine.slice(3))}
				</h2>,
			);
			return;
		}
		if (trimmedLine.startsWith("# ")) {
			flushList();
			elements.push(
				<h1
					key={`h1-${index}`}
					className="text-lg font-black text-gray-900 mt-5 mb-2.5 flex items-center gap-1.5 leading-snug"
				>
					{parseInlineStyles(trimmedLine.slice(2))}
				</h1>,
			);
			return;
		}

		const bulletMatch = trimmedLine.match(/^([*\-+])\s+(.*)$/);
		const numberedMatch = trimmedLine.match(/^(\d+)\.\s+(.*)$/);

		if (bulletMatch) {
			listItems.push(
				<li
					key={`li-${index}`}
					className="text-sm text-gray-700 leading-relaxed relative pl-5 list-none my-0.5"
				>
					<span className="absolute left-0 top-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full select-none" />
					{parseInlineStyles(bulletMatch[2])}
				</li>,
			);
			return;
		}

		if (numberedMatch) {
			listItems.push(
				<li
					key={`li-${index}`}
					className="text-sm text-gray-700 leading-relaxed relative pl-5 list-none my-0.5"
				>
					<span className="absolute left-0 top-0.5 text-xs font-semibold text-blue-600 select-none">
						{numberedMatch[1]}.
					</span>
					{parseInlineStyles(numberedMatch[2])}
				</li>,
			);
			return;
		}

		if (trimmedLine === "") {
			flushList();
			elements.push(<div key={`spacer-${index}`} className="h-1.5" />);
			return;
		}

		flushList();
		elements.push(
			<p
				key={`p-${index}`}
				className="text-sm text-gray-700 leading-relaxed my-0.5 wrap-break-word"
			>
				{parseInlineStyles(line)}
			</p>,
		);
	});

	flushList();

	return <div className="space-y-0.5 w-full">{elements}</div>;
}
