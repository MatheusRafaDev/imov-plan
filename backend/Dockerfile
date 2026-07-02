FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy solution file and project files
COPY ImovPlan.slnx .
COPY Core/ImovPlan.Domain/ImovPlan.Domain.csproj Core/ImovPlan.Domain/
COPY Core/ImovPlan.Application/ImovPlan.Application.csproj Core/ImovPlan.Application/
COPY Infrastructure/ImovPlan.Infrastructure/ImovPlan.Infrastructure.csproj Infrastructure/ImovPlan.Infrastructure/
COPY Presentation/ImovPlan.API/ImovPlan.API.csproj Presentation/ImovPlan.API/

# Note: We are using dotnet restore on the main API project which restores its dependencies.
RUN dotnet restore "Presentation/ImovPlan.API/ImovPlan.API.csproj"

# Copy the rest of the source code
COPY . .

# Build and publish
WORKDIR "/src/Presentation/ImovPlan.API"
RUN dotnet build "ImovPlan.API.csproj" -c Release -o /app/build
RUN dotnet publish "ImovPlan.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
EXPOSE 8080
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "ImovPlan.API.dll"]
