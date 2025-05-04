import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Award, 
  Search, 
  Eye, 
  XCircle, 
  FileText,
  Printer,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { usePermissions } from "@/hooks/usePermissions";
import { format } from "date-fns";

const CertificatesPage = () => {
  const { t } = useTranslation();
  const { can } = usePermissions();
  
  // Pagination and filter state
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    search: "",
    eventId: "",
    isRevoked: "",
  });
  
  // Fetch certificates with filtering and pagination
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['/api/certificates', { page, ...filters }],
  });
  
  // Fetch events for filter
  const { data: eventsData } = useQuery({
    queryKey: ['/api/events', { limit: 100 }],
    select: (data) => data.events,
  });
  
  // Handle filter change
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page when filters change
    refetch();
  };
  
  // Handle search
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    refetch();
  };
  
  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    refetch();
  };
  
  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="pb-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t("certificates.managementTitle")}</h1>
      </div>
      
      {/* Filters */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{t("certificates.filterCertificates")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-grow">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <Input
                    type="search"
                    placeholder={t("certificates.searchPlaceholder")}
                    className="pl-8"
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  />
                </div>
                <Button type="submit">{t("common.search")}</Button>
              </form>
            </div>
            
            <div>
              <Select
                value={filters.eventId}
                onValueChange={(value) => handleFilterChange("eventId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("certificates.selectEvent")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t("certificates.allEvents")}</SelectItem>
                  {eventsData?.map((event: any) => (
                    <SelectItem key={event.id} value={event.id.toString()}>
                      {event.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Select
                value={filters.isRevoked}
                onValueChange={(value) => handleFilterChange("isRevoked", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("certificates.certificateStatus")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t("certificates.allStatuses")}</SelectItem>
                  <SelectItem value="false">{t("certificates.active")}</SelectItem>
                  <SelectItem value="true">{t("certificates.revoked")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Certificates Table */}
      <Card className="mt-6">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : data?.certificates?.length === 0 ? (
            <div className="p-6 text-center">
              <Award className="h-12 w-12 mx-auto text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">{t("certificates.noCertificates")}</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t("certificates.noCertificatesMessage")}</p>
            </div>
          ) : (
            <div className="relative overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("certificates.certificateNumber")}</TableHead>
                    <TableHead>{t("certificates.recipient")}</TableHead>
                    <TableHead>{t("certificates.event")}</TableHead>
                    <TableHead>{t("certificates.issueDate")}</TableHead>
                    <TableHead>{t("certificates.status")}</TableHead>
                    <TableHead className="text-right">{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.certificates.map((certificate: any) => (
                    <TableRow key={certificate.id}>
                      <TableCell className="font-medium">{certificate.certificateNumber}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{certificate.user.fullName}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{certificate.user.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>{certificate.event.title}</TableCell>
                      <TableCell>{format(new Date(certificate.issuedDate), "MMM d, yyyy")}</TableCell>
                      <TableCell>
                        {certificate.isRevoked ? (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <XCircle className="h-3.5 w-3.5" />
                            {t("certificates.revoked")}
                          </Badge>
                        ) : (
                          <Badge variant="success" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            {t("certificates.active")}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button 
                          asChild 
                          variant="outline" 
                          size="sm"
                          className="h-8 px-2"
                        >
                          <Link href={`/certificates/${certificate.id}`}>
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            {t("common.view")}
                          </Link>
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="h-8 px-2"
                        >
                          <Printer className="h-3.5 w-3.5 mr-1" />
                          {t("certificates.print")}
                        </Button>
                        
                        {!certificate.isRevoked && can("certificate:revoke") && (
                          <Button 
                            variant="destructive" 
                            size="sm"
                            className="h-8 px-2"
                          >
                            <XCircle className="h-3.5 w-3.5 mr-1" />
                            {t("certificates.revoke")}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          {/* Pagination */}
          {data?.pagination && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700 sm:px-6">
              <div className="hidden sm:block">
                <p className="text-sm text-gray-700 dark:text-gray-400">
                  {t("pagination.showing")} <span className="font-medium">{(data.pagination.page - 1) * data.pagination.limit + 1}</span> {t("pagination.to")}{" "}
                  <span className="font-medium">
                    {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)}
                  </span>{" "}
                  {t("pagination.of")} <span className="font-medium">{data.pagination.total}</span> {t("pagination.results")}
                </p>
              </div>
              <div className="flex-1 flex justify-between sm:justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(data.pagination.page - 1)}
                  disabled={data.pagination.page === 1}
                >
                  {t("pagination.previous")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(data.pagination.page + 1)}
                  disabled={data.pagination.page === data.pagination.totalPages}
                  className="ml-3"
                >
                  {t("pagination.next")}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CertificatesPage;
