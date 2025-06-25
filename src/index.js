#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');
const axios = require('axios');
const { Command } = require('commander');

class HiveFlowMCPServer {
  constructor(config) {
    this.config = config;
    
    // Crear servidor MCP
    this.server = new Server({
      name: 'hiveflow-mcp-server',
      version: '1.0.0'
    }, {
      capabilities: {
        tools: {},
        resources: {}
      }
    });

    // Configurar cliente HTTP para HiveFlow
    this.hiveflowClient = axios.create({
      baseURL: this.config.apiUrl,
      headers: {
        'Authorization': `ApiKey ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    this.setupHandlers();
  }

  setupHandlers() {
    // Registrar herramientas disponibles
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'create_flow',
            description: 'Crea un nuevo flujo de trabajo en HiveFlow',
            inputSchema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'Nombre del flujo'
                },
                description: {
                  type: 'string',
                  description: 'Descripción del flujo'
                },
                nodes: {
                  type: 'array',
                  description: 'Nodos del flujo (opcional)',
                  items: { type: 'object' }
                }
              },
              required: ['name', 'description']
            }
          },
          {
            name: 'list_flows',
            description: 'Lista todos los flujos de trabajo del usuario',
            inputSchema: {
              type: 'object',
              properties: {
                status: {
                  type: 'string',
                  enum: ['active', 'paused', 'stopped', 'draft'],
                  description: 'Filtrar por estado del flujo (opcional)'
                },
                limit: {
                  type: 'number',
                  description: 'Límite de resultados (opcional)',
                  default: 50
                }
              }
            }
          },
          {
            name: 'get_flow',
            description: 'Obtiene detalles de un flujo específico',
            inputSchema: {
              type: 'object',
              properties: {
                flowId: {
                  type: 'string',
                  description: 'ID del flujo'
                }
              },
              required: ['flowId']
            }
          },
          {
            name: 'execute_flow',
            description: 'Ejecuta un flujo de trabajo específico',
            inputSchema: {
              type: 'object',
              properties: {
                flowId: {
                  type: 'string',
                  description: 'ID del flujo a ejecutar'
                },
                inputs: {
                  type: 'object',
                  description: 'Inputs opcionales para el flujo'
                }
              },
              required: ['flowId']
            }
          },
          {
            name: 'pause_flow',
            description: 'Pausa un flujo activo',
            inputSchema: {
              type: 'object',
              properties: {
                flowId: {
                  type: 'string',
                  description: 'ID del flujo a pausar'
                }
              },
              required: ['flowId']
            }
          },
          {
            name: 'resume_flow',
            description: 'Reanuda un flujo pausado',
            inputSchema: {
              type: 'object',
              properties: {
                flowId: {
                  type: 'string',
                  description: 'ID del flujo a reanudar'
                }
              },
              required: ['flowId']
            }
          },
          {
            name: 'list_mcp_servers',
            description: 'Lista los servidores MCP configurados en HiveFlow',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          },
          {
            name: 'create_mcp_server',
            description: 'Registra un nuevo servidor MCP en HiveFlow',
            inputSchema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'Nombre único del servidor MCP'
                },
                command: {
                  type: 'string',
                  description: 'Comando para ejecutar el servidor'
                },
                args: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Argumentos del comando'
                },
                description: {
                  type: 'string',
                  description: 'Descripción del servidor'
                }
              },
              required: ['name', 'command']
            }
          },
          {
            name: 'get_flow_executions',
            description: 'Obtiene el historial de ejecuciones de un flujo',
            inputSchema: {
              type: 'object',
              properties: {
                flowId: {
                  type: 'string',
                  description: 'ID del flujo'
                },
                limit: {
                  type: 'number',
                  description: 'Límite de resultados',
                  default: 10
                }
              },
              required: ['flowId']
            }
          }
        ]
      };
    });

    // Implementar ejecución de herramientas
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'create_flow':
            return await this.createFlow(args);
          case 'list_flows':
            return await this.listFlows(args);
          case 'get_flow':
            return await this.getFlow(args);
          case 'execute_flow':
            return await this.executeFlow(args);
          case 'pause_flow':
            return await this.pauseFlow(args);
          case 'resume_flow':
            return await this.resumeFlow(args);
          case 'list_mcp_servers':
            return await this.listMCPServers();
          case 'create_mcp_server':
            return await this.createMCPServer(args);
          case 'get_flow_executions':
            return await this.getFlowExecutions(args);
          default:
            throw new Error(`Herramienta desconocida: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `❌ Error ejecutando ${name}: ${error.response?.data?.error || error.message}`
            }
          ],
          isError: true
        };
      }
    });

    // Registrar recursos disponibles
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          {
            uri: 'hiveflow://flows',
            name: 'HiveFlow Flows',
            description: 'Lista de todos los flujos de trabajo',
            mimeType: 'application/json'
          },
          {
            uri: 'hiveflow://mcp-servers',
            name: 'MCP Servers',
            description: 'Lista de servidores MCP configurados',
            mimeType: 'application/json'
          },
          {
            uri: 'hiveflow://executions',
            name: 'Flow Executions',
            description: 'Historial de ejecuciones de flujos',
            mimeType: 'application/json'
          }
        ]
      };
    });

    // Implementar lectura de recursos
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;

      try {
        switch (uri) {
          case 'hiveflow://flows':
            const flowsResponse = await this.hiveflowClient.get('/api/flows');
            return {
              contents: [
                {
                  uri,
                  mimeType: 'application/json',
                  text: JSON.stringify(flowsResponse.data.flows, null, 2)
                }
              ]
            };

          case 'hiveflow://mcp-servers':
            const serversResponse = await this.hiveflowClient.get('/api/mcp/servers');
            return {
              contents: [
                {
                  uri,
                  mimeType: 'application/json',
                  text: JSON.stringify(serversResponse.data.servers, null, 2)
                }
              ]
            };

          case 'hiveflow://executions':
            const executionsResponse = await this.hiveflowClient.get('/api/flows/executions');
            return {
              contents: [
                {
                  uri,
                  mimeType: 'application/json',
                  text: JSON.stringify(executionsResponse.data.executions, null, 2)
                }
              ]
            };

          default:
            throw new Error(`Recurso no encontrado: ${uri}`);
        }
      } catch (error) {
        throw new Error(`Error leyendo recurso ${uri}: ${error.message}`);
      }
    });
  }

  // Métodos de implementación de herramientas
  async createFlow(args) {
    const response = await this.hiveflowClient.post('/api/flows', {
      name: args.name,
      description: args.description,
      nodes: args.nodes || [],
      edges: [],
      status: 'draft'
    });
    
    return {
      content: [
        {
          type: 'text',
          text: `✅ Flujo "${args.name}" creado exitosamente.\nID: ${response.data.data._id}\nEstado: ${response.data.data.status}`
        }
      ]
    };
  }

  async listFlows(args) {
    const params = {};
    if (args.status) params.status = args.status;
    if (args.limit) params.limit = args.limit;

    const response = await this.hiveflowClient.get('/api/flows', { params });
    const flows = response.data.data || [];
    
    const flowsList = flows.map(flow => 
      `• ${flow.name} (${flow._id}) - Estado: ${flow.status || 'draft'}`
    ).join('\n');
    
    return {
      content: [
        {
          type: 'text',
          text: `📋 Flujos encontrados (${flows.length}):\n\n${flowsList || 'No hay flujos disponibles'}`
        }
      ]
    };
  }

  async getFlow(args) {
    const response = await this.hiveflowClient.get(`/api/flows/${args.flowId}`);
    const flow = response.data.flow;
    
    return {
      content: [
        {
          type: 'text',
          text: `📊 Detalles del flujo "${flow.name}":\n• ID: ${flow._id}\n• Estado: ${flow.status || 'draft'}\n• Nodos: ${flow.nodes?.length || 0}\n• Descripción: ${flow.description || 'Sin descripción'}\n• Última actualización: ${flow.updatedAt || 'N/A'}`
        }
      ]
    };
  }

  async executeFlow(args) {
    const response = await this.hiveflowClient.post(`/api/flows/${args.flowId}/execute`, {
      inputs: args.inputs || {}
    });
    
    return {
      content: [
        {
          type: 'text',
          text: `🚀 Flujo ejecutado exitosamente.\nExecution ID: ${response.data.executionId || 'N/A'}\nEstado: ${response.data.status || 'iniciado'}`
        }
      ]
    };
  }

  async pauseFlow(args) {
    const response = await this.hiveflowClient.post(`/api/flows/${args.flowId}/pause`);
    
    return {
      content: [
        {
          type: 'text',
          text: `⏸️ Flujo pausado exitosamente.\nEstado: ${response.data.status || 'pausado'}`
        }
      ]
    };
  }

  async resumeFlow(args) {
    const response = await this.hiveflowClient.post(`/api/flows/${args.flowId}/resume`);
    
    return {
      content: [
        {
          type: 'text',
          text: `▶️ Flujo reanudado exitosamente.\nEstado: ${response.data.status || 'activo'}`
        }
      ]
    };
  }

  async listMCPServers() {
    const response = await this.hiveflowClient.get('/api/mcp/servers');
    const servers = response.data.servers || [];
    
    const serversList = servers.map(server => 
      `• ${server.name} - Estado: ${server.status} (${server.isConnected ? 'Conectado' : 'Desconectado'})`
    ).join('\n');
    
    return {
      content: [
        {
          type: 'text',
          text: `🔌 Servidores MCP (${servers.length}):\n\n${serversList || 'No hay servidores MCP configurados'}`
        }
      ]
    };
  }

  async createMCPServer(args) {
    const response = await this.hiveflowClient.post('/api/mcp/servers', {
      name: args.name,
      command: args.command,
      args: args.args || [],
      description: args.description || ''
    });
    
    return {
      content: [
        {
          type: 'text',
          text: `✅ Servidor MCP "${args.name}" registrado exitosamente.\nComando: ${args.command}\nEstado: registrado`
        }
      ]
    };
  }

  async getFlowExecutions(args) {
    const response = await this.hiveflowClient.get(`/api/flows/${args.flowId}/executions`, {
      params: { limit: args.limit || 10 }
    });
    const executions = response.data.executions || [];
    
    const executionsList = executions.map(exec => 
      `• ${exec.id} - Estado: ${exec.status} - ${exec.createdAt}`
    ).join('\n');
    
    return {
      content: [
        {
          type: 'text',
          text: `📈 Ejecuciones del flujo (${executions.length}):\n\n${executionsList || 'No hay ejecuciones'}`
        }
      ]
    };
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('🚀 HiveFlow MCP Server iniciado');
  }
}

// CLI principal
const program = new Command();

program
  .name('hiveflow-mcp')
  .description('HiveFlow MCP Server - Connect your AI assistant to HiveFlow')
  .version('1.0.0');

program
  .option('--api-url <url>', 'HiveFlow API URL', process.env.HIVEFLOW_API_URL || 'https://api.hiveflow.ai')
  .option('--api-key <key>', 'HiveFlow API Key', process.env.HIVEFLOW_API_KEY)
  .option('--instance-id <id>', 'HiveFlow Instance ID (for multi-tenant)', process.env.HIVEFLOW_INSTANCE_ID)
  .action(async (options) => {
    if (!options.apiKey) {
      console.error('❌ Error: HIVEFLOW_API_KEY is required');
      console.error('💡 Set the environment variable or use --api-key flag');
      process.exit(1);
    }

    const config = {
      apiUrl: options.apiUrl,
      apiKey: options.apiKey,
      instanceId: options.instanceId
    };

    const server = new HiveFlowMCPServer(config);
    await server.start();
  });

if (require.main === module) {
  program.parse();
} 