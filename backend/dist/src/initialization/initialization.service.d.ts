import { OnModuleInit } from '@nestjs/common';
import { MediaResourceService } from '../media/media-resource.service';
import { PlaySourceService } from '../play-sources/play-source.service';
export declare class InitializationService implements OnModuleInit {
    private readonly mediaResourceService;
    private readonly playSourceService;
    private readonly logger;
    constructor(mediaResourceService: MediaResourceService, playSourceService: PlaySourceService);
    onModuleInit(): Promise<void>;
    private initializeDefaultPlaySources;
}
