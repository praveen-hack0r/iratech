import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AlertCircle, Save, Undo } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Define site settings interface
interface SiteSettings {
  siteName: string;
  contactEmail: string;
  phoneNumber: string;
  whatsappNumber: string;
  enableRegistration: boolean;
  enableCourseCreation: boolean;
  maintenanceMode: boolean;
  emailVerificationRequired: boolean;
}

// Default site settings
const defaultSettings: SiteSettings = {
  siteName: "IraTech",
  contactEmail: "admin@iratech.com",
  phoneNumber: "9015090976",
  whatsappNumber: "9015090976",
  enableRegistration: true,
  enableCourseCreation: true,
  maintenanceMode: false,
  emailVerificationRequired: true,
};

export default function AdminSettings() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("general");
  const [formData, setFormData] = useState<SiteSettings>(defaultSettings);
  const [originalData, setOriginalData] = useState<SiteSettings>(defaultSettings);

  // Simulate fetching settings from the server
  const { isLoading, error } = useQuery({
    queryKey: ["/api/admin/settings"],
    queryFn: async () => {
      try {
        // In a real implementation, this would fetch from the server
        // const response = await apiRequest("GET", "/api/admin/settings");
        // const data = await response.json();
        // setFormData(data);
        // setOriginalData(data);
        // return data;
        
        // For now, use default settings
        setFormData(defaultSettings);
        setOriginalData(defaultSettings);
        return defaultSettings;
      } catch (error) {
        throw new Error("Failed to load settings");
      }
    },
  });

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle toggle changes
  const handleToggleChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  // Reset form to original data
  const handleReset = () => {
    setFormData(originalData);
    toast({
      title: "Settings Reset",
      description: "All changes have been discarded.",
    });
  };

  // Simulate saving settings to the server
  const saveSettingsMutation = useMutation({
    mutationFn: async (settings: SiteSettings) => {
      // In a real implementation, this would save to the server
      // const response = await apiRequest("POST", "/api/admin/settings", settings);
      // return await response.json();
      
      // For now, just simulate a successful save
      return settings;
    },
    onSuccess: (data) => {
      setOriginalData(data);
      toast({
        title: "Settings Saved",
        description: "Your settings have been updated successfully.",
      });
      // Invalidate related queries if needed
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error Saving Settings",
        description: error.message || "An error occurred while saving settings.",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettingsMutation.mutate(formData);
  };

  // Check if form has been modified
  const isFormModified = JSON.stringify(formData) !== JSON.stringify(originalData);

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Settings</h1>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={!isFormModified || isLoading}
          >
            <Undo className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isFormModified || isLoading || saveSettingsMutation.isPending}
          >
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load settings. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="contact">Contact Information</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>
                  Configure basic site settings and appearance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    name="siteName"
                    value={formData.siteName}
                    onChange={handleInputChange}
                    placeholder="Enter site name"
                  />
                  <p className="text-sm text-muted-foreground">
                    This name will be displayed throughout the site
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>
                  Manage contact details used across the platform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input
                    id="contactEmail"
                    name="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={handleInputChange}
                    placeholder="admin@example.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    placeholder="Contact phone number"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
                  <Input
                    id="whatsappNumber"
                    name="whatsappNumber"
                    value={formData.whatsappNumber}
                    onChange={handleInputChange}
                    placeholder="WhatsApp number for course verification"
                  />
                  <p className="text-sm text-muted-foreground">
                    This number will be displayed on checkout for payment verification
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="features">
            <Card>
              <CardHeader>
                <CardTitle>Feature Settings</CardTitle>
                <CardDescription>
                  Enable or disable platform features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="enableRegistration">User Registration</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow new users to register on the platform
                    </p>
                  </div>
                  <Switch
                    id="enableRegistration"
                    checked={formData.enableRegistration}
                    onCheckedChange={(checked) => 
                      handleToggleChange("enableRegistration", checked)
                    }
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="enableCourseCreation">Course Creation</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow instructors to create new courses
                    </p>
                  </div>
                  <Switch
                    id="enableCourseCreation"
                    checked={formData.enableCourseCreation}
                    onCheckedChange={(checked) => 
                      handleToggleChange("enableCourseCreation", checked)
                    }
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="emailVerificationRequired">Email Verification</Label>
                    <p className="text-sm text-muted-foreground">
                      Require email verification for new accounts
                    </p>
                  </div>
                  <Switch
                    id="emailVerificationRequired"
                    checked={formData.emailVerificationRequired}
                    onCheckedChange={(checked) => 
                      handleToggleChange("emailVerificationRequired", checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>
                  Configure system-level settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="maintenanceMode" className="text-red-500 font-medium">Maintenance Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      When enabled, the site will be inaccessible to regular users
                    </p>
                  </div>
                  <Switch
                    id="maintenanceMode"
                    checked={formData.maintenanceMode}
                    onCheckedChange={(checked) => 
                      handleToggleChange("maintenanceMode", checked)
                    }
                  />
                </div>
                
                {formData.maintenanceMode && (
                  <Alert className="mt-4 bg-yellow-50 border-yellow-200 text-yellow-800">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Warning</AlertTitle>
                    <AlertDescription>
                      Enabling maintenance mode will prevent regular users from accessing the site.
                      Only administrators will be able to log in.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
              <CardFooter>
                <p className="text-sm text-muted-foreground">
                  These settings affect the entire platform. Use with caution.
                </p>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </form>
    </AdminLayout>
  );
}