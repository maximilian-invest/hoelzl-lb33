/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useState, type Dispatch, type SetStateAction } from "react";
import { saveAs } from "file-saver";
import type { ProjectImage, ProjectPdf } from "@/app/editor/components/DocumentUploads";

export interface ProjectData {
  cfgCases: Record<string, unknown>;
  finCases: Record<string, unknown>;
  images: ProjectImage[];
  pdfs: ProjectPdf[];
  showUploads: boolean;
  texts: Record<string, unknown>;
}

interface Props {
  cfgCases: any;
  finCases: any;
  images: ProjectImage[];
  pdfs: ProjectPdf[];
  showUploads: boolean;
  texts: any;
  setCfgCases: Dispatch<SetStateAction<any>>;
  setFinCases: Dispatch<SetStateAction<any>>;
  setImages: Dispatch<SetStateAction<ProjectImage[]>>;
  setPdfs: Dispatch<SetStateAction<ProjectPdf[]>>;
  setShowUploads: Dispatch<SetStateAction<boolean>>;
  setTexts: Dispatch<SetStateAction<any>>;
  defaultCfgCases: any;
  defaultFinCases: any;
}

export function useProjectStorage(props: Props) {
  const [projects, setProjects] = useState<Record<string, ProjectData>>(() => {
    try {
      const raw = localStorage.getItem("lb33_projects");
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const saveProject = useCallback(() => {
    const name = prompt("Projektname?");
    if (!name) return;
    const newProjects = {
      ...projects,
      [name]: {
        cfgCases: props.cfgCases,
        finCases: props.finCases,
        images: props.images,
        pdfs: props.pdfs,
        showUploads: props.showUploads,
        texts: props.texts,
      },
    };
    setProjects(newProjects);
    localStorage.setItem("lb33_projects", JSON.stringify(newProjects));
    localStorage.setItem("lb33_current_project", name);
    alert("Gespeichert");
  }, [projects, props]);

  const resetProject = useCallback(() => {
    if (
      !confirm(
        "Sind Sie sicher? Vergessen Sie nicht Ihr Projekt zu speichern/downloaden"
      )
    )
      return;
    props.setCfgCases(props.defaultCfgCases);
    props.setFinCases(props.defaultFinCases);
    props.setImages([]);
    props.setPdfs([]);
    props.setShowUploads(true);
    props.setTexts({
      title: "",
      subtitle: "",
      story: "",
      tipTitle: "",
      tipText: "",
      upsideTitle: "",
      upsideText: "",
    });
    localStorage.removeItem("lb33_cfg_cases");
    localStorage.removeItem("lb33_fin_cases");
    localStorage.removeItem("lb33_images");
    localStorage.removeItem("lb33_pdfs");
    localStorage.removeItem("lb33_show_uploads");
    localStorage.removeItem("lb33_texts");
    localStorage.removeItem("lb33_current_project");
  }, [props]);

  const loadProject = useCallback(
    (name: string) => {
      const raw = localStorage.getItem("lb33_projects");
      if (!raw) return;
      try {
        const stored = JSON.parse(raw);
        const data = stored[name] as ProjectData | undefined;
        if (!data) return;
        props.setCfgCases(data.cfgCases);
        props.setFinCases(data.finCases);
        props.setImages(data.images);
        props.setPdfs(data.pdfs);
        props.setShowUploads(data.showUploads);
        props.setTexts(data.texts);
        setProjects(stored);
        localStorage.setItem("lb33_current_project", name);
      } catch {
        /* ignore */
      }
    },
    [props]
  );

  const exportProject = useCallback(() => {
    const data = {
      cfgCases: props.cfgCases,
      finCases: props.finCases,
      images: props.images,
      pdfs: props.pdfs,
      showUploads: props.showUploads,
      texts: props.texts,
    };
    const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    saveAs(blob, "investmentcase.json");
  }, [props]);

  return { projects, saveProject, resetProject, loadProject, exportProject };
}
