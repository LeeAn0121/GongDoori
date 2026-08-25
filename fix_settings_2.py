with open('src/components/Settings.tsx', 'r') as f:
    content = f.read()

content = content.replace("  const [isSupportOpen, setIsSupportOpen] = useState(false);\n", "")
content = content.replace("  const [supportContent, setSupportContent] = useState('');\n", "")

with open('src/components/Settings.tsx', 'w') as f:
    f.write(content)
