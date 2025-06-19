import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useServers, useToggleServerStatus, useDeleteServer, useTestConnection } from "@/lib/queries";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { ServerFormModal } from "@/components/server/form-modal";
import { ConfirmDialog } from "@/components/utils/confirm-dialog";
import { 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton 
} from "@/components/ui/sidebar";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { MailIcon, ServerIcon, ShieldIcon, Edit, Power, Trash2, TestTube } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ServerListItem } from "@/types";

export function List() {
  const navigate = useNavigate();
  const { serverId } = useParams();
  const [editingServer, setEditingServer] = useState<ServerListItem | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: "delete" | "toggle";
    server: ServerListItem | null;
  }>({ open: false, type: "delete", server: null });
  
  const { data: servers = [], isLoading: loading, error } = useServers();
  const toggleServerStatus = useToggleServerStatus();
  const deleteServer = useDeleteServer();
  const testConnection = useTestConnection();

  const handleEditServer = async (server: ServerListItem) => {
    setEditingServer(server);
  };

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

  const handleToggleStatus = (server: ServerListItem) => {
    setConfirmDialog({
      open: true,
      type: "toggle",
      server,
    });
  };

  const handleDeleteServer = (server: ServerListItem) => {
    setConfirmDialog({
      open: true,
      type: "delete",
      server,
    });
  };

  const executeAction = async () => {
    if (!confirmDialog.server) return;

    try {
      if (confirmDialog.type === "toggle") {
        await toggleServerStatus.mutateAsync(confirmDialog.server.id);
        const newStatus = confirmDialog.server.status === "active" ? "inactive" : "active";
        toast.success(`Server marked as ${newStatus}`);
      } else if (confirmDialog.type === "delete") {
        await deleteServer.mutateAsync(confirmDialog.server.id);
        toast.success("Server deleted successfully");
        if (serverId === confirmDialog.server.id) {
          navigate("/");
        }
      }
    } catch (error) {
      toast.error(`Failed to ${confirmDialog.type === "toggle" ? "update status" : "delete"} server`);
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
        {servers.map((server) => (
          <SidebarMenuItem key={server.id}>
            <ContextMenu>
              <ContextMenuTrigger asChild>
                <SidebarMenuButton
                  isActive={server.id === serverId}
                  onClick={() => navigate(`/server/${server.id}`)}
                  className="gap-3 py-6"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border">
                    {getServerIcon(server.name)}
                  </span>
                  <div className="flex flex-1 flex-col items-start text-sm">
                    <span className="truncate font-medium">{server.name}</span>
                    <StatusBadge status={server.status} />
                  </div>
                </SidebarMenuButton>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem onClick={() => handleEditServer(server)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Server
                </ContextMenuItem>
                <ContextMenuItem onClick={() => handleTestConnection(server)}>
                  <TestTube className="mr-2 h-4 w-4" />
                  Test Connection
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem onClick={() => handleToggleStatus(server)}>
                  <Power className="mr-2 h-4 w-4" />
                  Mark as {server.status === "active" ? "Inactive" : "Active"}
                </ContextMenuItem>
                <ContextMenuItem 
                  onClick={() => handleDeleteServer(server)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Server
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>

      <ServerFormModal
        open={!!editingServer}
        onOpenChange={(open) => !open && setEditingServer(null)}
        server={editingServer || undefined}
        mode="edit"
      />

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
        title={
          confirmDialog.type === "delete" 
            ? "Delete Server" 
            : `Mark Server as ${confirmDialog.server?.status === "active" ? "Inactive" : "Active"}`
        }
        description={
          confirmDialog.type === "delete"
            ? `Are you sure you want to delete "${confirmDialog.server?.name}"? This action cannot be undone.`
            : `Are you sure you want to mark "${confirmDialog.server?.name}" as ${confirmDialog.server?.status === "active" ? "inactive" : "active"}?`
        }
        confirmText={confirmDialog.type === "delete" ? "Delete" : "Confirm"}
        onConfirm={executeAction}
        variant={confirmDialog.type === "delete" ? "destructive" : "default"}
      />
    </>
  );
}

export default List;
