import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ChevronLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { usePermissions } from "@/hooks/usePermissions";
import CertificatePreview from "@/components/certificates/CertificatePreview";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface CertificateDetailsPageProps {
  id: string;
}

const CertificateDetailsPage: React.FC<CertificateDetailsPageProps> = ({ id }) => {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { can } = usePermissions();
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [revokeReason, setRevokeReason] = useState("");
  
  // Fetch certificate details
  const { data: certificate, isLoading, refetch } = useQuery({
    queryKey: [`/api/certificates/${id}`],
  });
  
  // Revoke certificate mutation
  const { mutate: revokeCertificate, isPending: isRevoking } = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/certificates/${id}/revoke`, {
        reason: revokeReason,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("certificates.revokeSuccess"),
        description: t("certificates.revokeSuccessMessage"),
      });
      // Close the dialog
      setRevokeDialogOpen(false);
      // Reset reason
      setRevokeReason("");
      // Invalidate certificate query cache
      queryClient.invalidateQueries({ queryKey: [`/api/certificates/${id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/certificates'] });
      // Refresh the certificate data
      refetch();
    },
    onError: (error) => {
      console.error("Error revoking certificate:", error);
      toast({
        title: t("certificates.revokeError"),
        description: t("certificates.revokeErrorMessage"),
        variant: "destructive",
      });
    },
  });
  
  // Handle revoke certificate
  const handleRevokeCertificate = () => {
    if (!revokeReason.trim()) {
      toast({
        title: t("certificates.reasonRequired"),
        description: t("certificates.reasonRequiredMessage"),
        variant: "destructive",
      });
      return;
    }
    revokeCertificate();
  };
  
  // Handle download certificate
  const handleDownloadCertificate = () => {
    // In a real app, this would trigger a download from the server
    toast({
      title: t("certificates.download"),
      description: t("certificates.downloadStarted"),
    });
  };
  
  if (isLoading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="pb-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="mt-6">
          <Skeleton className="h-[600px] w-full" />
        </div>
      </div>
    );
  }
  
  if (!certificate) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="pb-5 border-b border-gray-200">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t("certificates.notFound")}</h1>
        </div>
        <div className="mt-6 text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 mb-4">{t("certificates.certificateNotFoundMessage")}</p>
          <Button
            onClick={() => navigate("/certificates")}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            {t("certificates.backToCertificates")}
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="pb-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          {t("certificates.detailsTitle")}
        </h1>
        <div className="mt-3 sm:mt-0 sm:ml-4">
          <Button
            variant="outline"
            onClick={() => navigate("/certificates")}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            {t("certificates.backToCertificates")}
          </Button>
          
          {!certificate.isRevoked && can("certificate:revoke") && (
            <Dialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="ml-3"
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  {t("certificates.revokeCertificate")}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{t("certificates.confirmRevoke")}</DialogTitle>
                  <DialogDescription>
                    {t("certificates.revokeWarning")}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="reason">{t("certificates.revokeReason")}</Label>
                    <Textarea
                      id="reason"
                      value={revokeReason}
                      onChange={(e) => setRevokeReason(e.target.value)}
                      placeholder={t("certificates.revokeReasonPlaceholder")}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setRevokeDialogOpen(false)}
                    disabled={isRevoking}
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleRevokeCertificate}
                    disabled={isRevoking}
                  >
                    {isRevoking ? t("common.processing") : t("certificates.revoke")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
      
      <div className="mt-6">
        {certificate.isRevoked && (
          <Card className="mb-6 border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
            <CardContent className="p-4 flex items-start">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mr-3 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-600 dark:text-red-400">{t("certificates.certificateRevoked")}</h3>
                <p className="text-sm text-red-600/80 dark:text-red-400/80 mt-1">{t("certificates.revokedOn")} {new Date(certificate.revokedDate).toLocaleDateString()}</p>
                {certificate.revokedReason && (
                  <p className="text-sm text-red-600/80 dark:text-red-400/80 mt-1">{t("certificates.reason")}: {certificate.revokedReason}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        
        <CertificatePreview
          certificate={{
            id: certificate.id,
            certificateNumber: certificate.certificateNumber,
            qrCode: certificate.qrCode,
            issuedDate: certificate.issuedDate,
            event: {
              title: certificate.registration.event.title,
              startDate: certificate.registration.event.startDate,
              endDate: certificate.registration.event.endDate,
            },
            user: {
              fullName: certificate.registration.user.fullName,
              organization: certificate.registration.user.organization,
              position: certificate.registration.user.position,
            },
          }}
          onDownload={handleDownloadCertificate}
        />
      </div>
    </div>
  );
};

export default CertificateDetailsPage;
