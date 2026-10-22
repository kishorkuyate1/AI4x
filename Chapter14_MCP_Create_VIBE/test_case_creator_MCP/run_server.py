#!/usr/bin/env python
"""Entry point for running the TestCreator MCP server"""
import sys
import argparse
from tc_mcp.app import server


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="TestCreator MCP Server")
    parser.add_argument(
        "--host",
        default="127.0.0.1",
        help="Host to bind to (default: 127.0.0.1)"
    )
    parser.add_argument(
        "--port",
        type=int,
        default=8000,
        help="Port to bind to (default: 8000)"
    )
    parser.add_argument(
        "--mode",
        choices=["http", "stdio"],
        default="http",
        help="Server mode: http or stdio (default: http)"
    )
    
    args = parser.parse_args()
    
    if args.mode == "http":
        print(f"Starting TestCreator MCP in HTTP mode")
        print(f"Listening on {args.host}:{args.port}")
        print(f"\nConnect via:")
        print(f"  HTTP: http://{args.host}:{args.port}")
        print(f"  MCP Inspector: npx @modelcontextprotocol/inspector --transport http --server-url http://{args.host}:{args.port}")
        
        # Run FastMCP HTTP server
        try:
            import asyncio
            asyncio.run(server.run_http_async(host=args.host, port=args.port))
        except Exception as e:
            print(f"Error starting server: {e}")
            sys.exit(1)
    
    elif args.mode == "stdio":
        print("Starting TestCreator MCP in stdio mode")
        # For stdio mode, just import and server will handle
        print("Server ready for stdio connections")


if __name__ == "__main__":
    main()
