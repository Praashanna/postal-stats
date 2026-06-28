import { useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useServers, useTestConnection } from "@/lib/queries";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { MailIcon, ServerIcon, ShieldIcon, TestTube } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ServerListItem } from "@/types";

export function List() {
  const navigate = useNavigate();
  const { serverId } = useParams();
  
  const { data: servers = [], isLoading: loading, error } = useServers();
  const testConnection = useTestConnection();
  const groupedServers = useMemo(() => {
    const groups = new Map<
      string,
      {
        name: string;
        servers: ServerListItem[];
      }
    >();

    servers.forEach((server) => {
      const organization = server.organization;
      const key = organization
        ? String(organization.id ?? organization.uuid ?? organization.permalink)
        : "unassigned";
      const name = organization?.name || "Unassigned organization";

      if (!groups.has(key)) {
        groups.set(key, { name, servers: [] });
      }

      groups.get(key)?.servers.push(server);
    });

    return Array.from(groups.entries()).map(([key, group]) => ({
      key,
      ...group,
    }));
  }, [servers]);

  const handleTestConnection = async (server: ServerListItem) => {
    try {
      const result = await testConnection.mutateAsync(server.id);
      if (result.data.connection_successful) {
        toast.success(`Connection test successful for ${server.name}!`);
      } else {
        toast.error(`Connection test failed for ${server.name}!`);
      }
    } catch (error) {
      toast.error(`Failed to test connection for ${server.name}`);
    }
  };

  useEffect(() => {
    if (!loading && !serverId && servers.length > 0) {
      navigate(`/server/${servers[0].id}`);
    }
  }, [navigate, serverId, servers, loading]);

  const getServerIcon = (name: string) => {
    if (name.toLowerCase().includes("production")) {
      return <MailIcon className="h-4 w-4" />;
    } else if (name.toLowerCase().includes("backup")) {
      return <ShieldIcon className="h-4 w-4" />;
    } else {
      return <ServerIcon className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center space-x-3 p-2">
            <Skeleton className="h-8 w-8 rounded-md" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-2 text-center">
        <p className="text-destructive text-sm">Failed to load servers</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <>
      <SidebarMenu>
        {groupedServers.map((group) => (
          <SidebarMenuItem key={group.key}>
            <div className="px-2 py-1.5 text-xs font-medium text-sidebar-foreground/70">
              <span className="block truncate">{group.name}</span>
            </div>
            <SidebarMenuSub>
              {group.servers.map((server) => (
                <SidebarMenuSubItem key={server.id}>
                  <ContextMenu>
                    <ContextMenuTrigger asChild>
                      <SidebarMenuSubButton
                        asChild
                        isActive={String(server.id) === serverId}
                        className="h-auto py-2"
                      >
                        <button
                          type="button"
                          onClick={() => navigate(`/server/${server.id}`)}
                          className="w-full"
                        >
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border">
                            {getServerIcon(server.name)}
                          </span>
                          <div className="flex min-w-0 flex-1 flex-col items-start">
                            <span className="truncate font-medium">{server.name}</span>
                            <StatusBadge status={server.status} />
                          </div>
                        </button>
                      </SidebarMenuSubButton>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem onClick={() => handleTestConnection(server)}>
                        <TestTube className="mr-2 h-4 w-4" />
                        Test Connection
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </>
  );
}

export default List;
