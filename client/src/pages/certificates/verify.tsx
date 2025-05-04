import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useParams } from "wouter";
import { 
  CheckCircle, 
  XCircle, 
  SearchIcon 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import CertificatePreview from "@/components/certificates/CertificatePreview";

const CertificateVerifyPage = () => {
  const { t } = useTranslation();
  const params = useParams();
  const [, navigate] = useLocation();
  const [certificateNumber, setCertificateNumber] = useState(params.number || "");
  
  // Only fetch if we have a certificate number
  const shouldFetch = !!params.number;
  
  // Fetch certificate verification
  const { data, isLoading, refetch, isError, error } = useQuery({
    queryKey: [`/api/certificates/verify/${params.number}`],
    enabled: shouldFetch,
  });
  
  // Handle verify certificate
  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (certificateNumber) {
      navigate(`/certificates/verify/${certificateNumber}`);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-center text-2xl flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-600 w-6 h-6 mr-2">
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
            {t("certificates.verifyTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerify} className="flex gap-2 mb-6">
            <div className="relative flex-grow">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
              <Input
                type="text"
                placeholder={t("certificates.enterCertificateNumber")}
                className="pl-8"
                value={certificateNumber}
                onChange={(e) => setCertificateNumber(e.target.value)}
              />
            </div>
            <Button type="submit">{t("certificates.verify")}</Button>
          </form>
          
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : isError ? (
            <div className="text-center p-8 border rounded-lg border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
              <XCircle className="h-12 w-12 mx-auto text-red-500" />
              <h3 className="mt-4 text-lg font-medium text-red-800 dark:text-red-200">{t("certificates.verificationFailed")}</h3>
              <p className="mt-2 text-sm text-red-600 dark:text-red-300">
                {t("certificates.certificateNotFound")}
              </p>
            </div>
          ) : data ? (
            data.valid ? (
              <div>
                <div className="text-center p-4 mb-6 border rounded-lg border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
                  <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
                  <h3 className="mt-2 text-lg font-medium text-green-800 dark:text-green-200">{t("certificates.certificateValid")}</h3>
                  <p className="mt-1 text-sm text-green-600 dark:text-green-300">
                    {t("certificates.validCertificateMessage")}
                  </p>
                </div>
                
                <CertificatePreview
                  certificate={{
                    id: 0, // This is just for preview
                    certificateNumber: data.certificate.certificateNumber,
                    qrCode: "", // We don't need to show QR code on verification page
                    issuedDate: data.certificate.issuedDate,
                    event: {
                      title: data.certificate.event.title,
                      startDate: data.certificate.event.startDate,
                      endDate: data.certificate.event.endDate,
                    },
                    user: {
                      fullName: data.certificate.user.fullName,
                      organization: data.certificate.user.organization,
                      position: data.certificate.user.position,
                    },
                  }}
                />
              </div>
            ) : (
              <div className="text-center p-8 border rounded-lg border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
                <XCircle className="h-12 w-12 mx-auto text-red-500" />
                <h3 className="mt-4 text-lg font-medium text-red-800 dark:text-red-200">{t("certificates.certificateRevoked")}</h3>
                <p className="mt-2 text-sm text-red-600 dark:text-red-300">
                  {data.revoked 
                    ? t("certificates.certificateRevokedMessage") 
                    : t("certificates.certificateInvalidMessage")
                  }
                </p>
                {data.revokedDate && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-300">
                    {t("certificates.revokedOn")} {new Date(data.revokedDate).toLocaleDateString()}
                  </p>
                )}
                {data.revokedReason && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-300">
                    {t("certificates.reason")}: {data.revokedReason}
                  </p>
                )}
              </div>
            )
          ) : shouldFetch ? (
            <div className="text-center p-8 border rounded-lg">
              <p className="text-gray-500 dark:text-gray-400">{t("certificates.noDataAvailable")}</p>
            </div>
          ) : (
            <div className="text-center p-8 border rounded-lg border-gray-200 bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
              <p className="text-gray-500 dark:text-gray-400">{t("certificates.enterCertificateToVerify")}</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            {t("certificates.verificationDisclaimer")}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CertificateVerifyPage;
