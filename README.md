# @hiveflow/mcp-server

Official Model Context Protocol (MCP) server for HiveFlow. Connect your AI assistants (Claude, Cursor, etc.) directly to your HiveFlow automation platform.

## 🚀 Quick Start

### Installation

```bash
npm install -g @hiveflow/mcp-server
```

### Configuration

Add to your MCP client configuration (e.g., `.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "hiveflow": {
      "command": "npx",
      "args": ["-y", "@hiveflow/mcp-server"],
      "env": {
        "HIVEFLOW_API_KEY": "your-api-key-here",
        "HIVEFLOW_API_URL": "https://api.hiveflow.ai"
      }
    }
  }
}
```

### For Local Development

```json
{
  "mcpServers": {
    "hiveflow": {
      "command": "npx",
      "args": ["-y", "@hiveflow/mcp-server"],
      "env": {
        "HIVEFLOW_API_KEY": "your-api-key-here",
        "HIVEFLOW_API_URL": "http://localhost:5000"
      }
    }
  }
}
```

## 🔑 Getting Your API Key

### Option 1: From HiveFlow Dashboard
1. Log in to your HiveFlow dashboard
2. Go to Settings > API Keys
3. Generate a new API key

### Option 2: From Command Line (Self-hosted)
```bash
cd your-hiveflow-backend
node get-api-key.js your-email@example.com
```

## 🛠️ Available Tools

Once configured, you'll have access to these tools in your AI assistant:

### Flow Management
- `create_flow` - Create new automation flows
- `list_flows` - List all your flows
- `get_flow` - Get details of a specific flow
- `execute_flow` - Execute a flow with optional inputs
- `pause_flow` - Pause an active flow
- `resume_flow` - Resume a paused flow
- `get_flow_executions` - Get execution history

### MCP Server Management
- `list_mcp_servers` - List configured MCP servers
- `create_mcp_server` - Register new MCP servers

## 📊 Available Resources

- `hiveflow://flows` - Access to all your flows data
- `hiveflow://mcp-servers` - MCP servers configuration
- `hiveflow://executions` - Flow execution history

## 💡 Usage Examples

### Create a New Flow
```
AI: "Create a flow called 'Email Processor' that analyzes incoming emails"
```

### List Active Flows
```
AI: "Show me all my active flows"
```

### Execute a Flow
```
AI: "Execute the flow with ID 'abc123' with input data {email: 'test@example.com'}"
```

### Get Flow Status
```
AI: "What's the status of my Email Processor flow?"
```

## 🔧 Configuration Options

### Environment Variables

- `HIVEFLOW_API_KEY` - Your HiveFlow API key (required)
- `HIVEFLOW_API_URL` - Your HiveFlow instance URL (default: https://api.hiveflow.ai)
- `HIVEFLOW_INSTANCE_ID` - Instance ID for multi-tenant setups (optional)

### Command Line Options

```bash
hiveflow-mcp --api-key YOUR_KEY --api-url https://your-instance.com
```

## 🏗️ Architecture

This MCP server acts as a bridge between your AI assistant and HiveFlow:

```
AI Assistant (Claude/Cursor) ↔ MCP Server ↔ HiveFlow API
```

## 🔒 Security

- API keys are transmitted securely over HTTPS
- All requests are authenticated and authorized
- No data is stored locally by the MCP server

## 🐛 Troubleshooting

### Common Issues

**"HIVEFLOW_API_KEY is required"**
- Make sure you've set the API key in your MCP configuration
- Verify the API key is valid and not expired

**"Cannot connect to HiveFlow API"**
- Check that your HiveFlow instance is running
- Verify the API URL is correct
- Ensure there are no firewall restrictions

**"MCP server not found"**
- Restart your AI assistant completely
- Verify the MCP configuration file is in the correct location
- Check that the package is installed: `npm list -g @hiveflow/mcp-server`

### Debug Mode

For detailed logging, set the environment variable:
```bash
export DEBUG=hiveflow-mcp:*
```

## 📚 Documentation

- [HiveFlow Documentation](https://doc.hiveflow.ai)
- [MCP Protocol Specification](https://modelcontextprotocol.io)
- [API Reference](https://api.hiveflow.ai/docs)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

- [GitHub Issues](https://github.com/hiveflowai/hiveflow-mcp-server/issues)
- [Discord Community](https://discord.gg/3cc69VFb)
- [Email Support](mailto:support@hiveflow.ai)

---

Made with ❤️ by the HiveFlow team 