import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useCreateServer, useUpdateServer, useTestConnection } from "@/lib/queries";
import { ServerListItem } from "@/types";
import { Loader2, TestTube } from "lucide-react";

interface ServerFormData {
  name: string;
  host: string;
  port: number;
  database: string;
  username: string;
  password?: string;
  is_active: boolean;
}

interface ServerFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  server?: ServerListItem;
  mode: "create" | "edit";
}

export function ServerFormModal({ open, onOpenChange, server, mode }: ServerFormModalProps) {
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ServerFormData>({
    defaultValues: {
      name: "",
      host: "",
      port: 3306,
      database: "",
      username: "",
      password: "",
      is_active: true,
    },
  });

  const createServer = useCreateServer();
  const updateServer = useUpdateServer();
  const testConnection = useTestConnection();

  useEffect(() => {
    if (!open) {
      reset();
      setIsTestingConnection(false);
    }
  }, [open, reset]);

  useEffect(() => {
    if (mode === "edit" && server) {
      setValue("name", server.name);
      setValue("is_active", server.status === "active");
      setValue("host", server.host);
      setValue("port", server.port);
      setValue("database", server.database);
      setValue("username", server.username);
      setValue("password", "");
    } else if (mode === "create") {
      reset({
        name: "",
        host: "",
        port: 3306,
        database: "",
        username: "",
        password: "",
        is_active: true,
      });
    }
  }, [mode, server, setValue, reset]);

  const onSubmit = async (data: ServerFormData) => {
    try {
      if (mode === "create") {
        await createServer.mutateAsync(data);
        toast.success("Server created successfully!");
      } else if (server) {
        await updateServer.mutateAsync({ 
          id: server.id, 
          data: data 
        });
        toast.success("Server updated successfully!");
      }
      handleClose();
    } catch (error) {
      toast.error(
        mode === "create" 
          ? "Failed to create server" 
          : "Failed to update server"
      );
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    reset();
    setIsTestingConnection(false);
  };

  const handleTestConnection = async () => {
    if (!server) return;
    
    setIsTestingConnection(true);
    try {
      const result = await testConnection.mutateAsync(server.id);
      if (result.data.connection_successful) {
        toast.success("Connection test successful!");
      } else {
        toast.error("Connection test failed!");
      }
    } catch (error) {
      toast.error("Failed to test connection");
    } finally {
      setIsTestingConnection(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={(newOpen) => {
        if (!newOpen) {
          handleClose();
        } else {
          onOpenChange(newOpen);
        }
      }}
    >
      <DialogContent className="sm:max-w-[425px]" asChild={false}>
        <div>
          <DialogHeader>
            <DialogTitle>
              {mode === "create" ? "Add New Server" : "Edit Server"}
            </DialogTitle>
            <DialogDescription>
              {mode === "create" 
                ? "Configure a new postal server connection." 
                : "Update the server configuration."
              }
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Server Name</Label>
            <Input
              id="name"
              {...register("name", { required: "Server name is required" })}
              placeholder="Production Server"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="host">Host</Label>
              <Input
                id="host"
                {...register("host", { required: "Host is required" })}
                placeholder="localhost"
              />
              {errors.host && (
                <p className="text-sm text-destructive">{errors.host.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="port">Port</Label>
              <Input
                id="port"
                type="number"
                {...register("port", { 
                  required: "Port is required",
                  min: { value: 1, message: "Port must be at least 1" },
                  max: { value: 65535, message: "Port must be at most 65535" }
                })}
                placeholder="3306"
              />
              {errors.port && (
                <p className="text-sm text-destructive">{errors.port.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="database">Database</Label>
            <Input
              id="database"
              {...register("database", { required: "Database is required" })}
              placeholder="postal_db"
            />
            {errors.database && (
              <p className="text-sm text-destructive">{errors.database.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              {...register("username", { required: "Username is required" })}
              placeholder="postal_user"
            />
            {errors.username && (
              <p className="text-sm text-destructive">{errors.username.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              {...register("password")}
              placeholder="Leave empty to keep current"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is_active">Active</Label>
            <Switch
              id="is_active"
              checked={watch("is_active")}
              onCheckedChange={(checked) => setValue("is_active", checked)}
            />
          </div>

          <DialogFooter className="flex justify-between">
            <div>
              {mode === "edit" && server && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={isTestingConnection}
                >
                  {isTestingConnection ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <TestTube className="mr-2 h-4 w-4" />
                      Test Connection
                    </>
                  )}
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {mode === "create" ? "Creating..." : "Updating..."}
                  </>
                ) : (
                  mode === "create" ? "Create Server" : "Update Server"
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
